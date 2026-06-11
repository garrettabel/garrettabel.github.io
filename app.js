/* app.js - v1
 * Realtonomy - Dawn voice assistant + Firebase counters
 * To update: bump ?v=N in index.html script tag
 */

/* ── Firebase init ────────────────────────────────────────── */
firebase.initializeApp({
  apiKey: "AIzaSyCfssB7iM_zTHDBOVoLH9JqVxNZwaVbK9s",
  authDomain: "realtonomy.firebaseapp.com",
  projectId: "realtonomy",
  storageBucket: "realtonomy.firebasestorage.app",
  messagingSenderId: "393079711947",
  appId: "1:393079711947:web:612f107ae44720261ed34e"
});
var db = firebase.firestore();
var ref = db.collection("stats").doc("counters");
var FV = firebase.firestore.FieldValue;

/* ── UI refs ──────────────────────────────────────────────── */
var visitEl = document.getElementById("visitCount");
var clickEl = document.getElementById("clickCount");

/* ── Voice selection ──────────────────────────────────────── */
var selectedVoice = null;
var dawnPrompt = null;

var FEMALE_VOICES = [
  'Google UK English Female',
  'Microsoft Libby',
  'Microsoft Mia',
  'Microsoft Sonia',
  'Microsoft Hazel',
  'Serena',
  'Martha',
  'Microsoft Zira',
  'Microsoft Jenny',
  'Microsoft Aria',
  'Microsoft Michelle',
  'Microsoft Monica',
  'Samantha',
  'Victoria',
  'Karen',
  'Moira',
  'Tessa'
];

var MALE_VOICES = [
  'David','Mark','Daniel','George','James','Ryan','Thomas',
  'Eric','Guy','Richard','Fred','Alex','Bruce','Junior','Ralph',
  'Albert'
];

function resolveVoice() {
  var voices = speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return;

  // 1. Priority: exact female whitelist match
  for (var i = 0; i < FEMALE_VOICES.length; i++) {
    for (var j = 0; j < voices.length; j++) {
      if (voices[j].name.indexOf(FEMALE_VOICES[i]) === 0) {
        selectedVoice = voices[j];
        return;
      }
    }
  }

  // 2. Fallback: any en-GB voice not on male blacklist
  for (var k = 0; k < voices.length; k++) {
    var vname = voices[k].name;
    var isMale = false;
    for (var m = 0; m < MALE_VOICES.length; m++) {
      if (vname.indexOf(MALE_VOICES[m]) !== -1) { isMale = true; break; }
    }
    if (!isMale && voices[k].lang && voices[k].lang.indexOf('en-GB') === 0) {
      selectedVoice = voices[k];
      return;
    }
  }

  // 3. Final fallback: any English voice not on male blacklist
  for (var n = 0; n < voices.length; n++) {
    var vn = voices[n].name;
    var isMaleN = false;
    for (var p = 0; p < MALE_VOICES.length; p++) {
      if (vn.indexOf(MALE_VOICES[p]) !== -1) { isMaleN = true; break; }
    }
    if (!isMaleN && voices[n].lang && voices[n].lang.indexOf('en') === 0) {
      selectedVoice = voices[n];
      return;
    }
  }
}

// Load voices - resolve immediately and also on voiceschanged
resolveVoice();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = function() {
    resolveVoice();
    speechSynthesis.onvoiceschanged = null;
  };
}

/* ── Load DawnPrompt.txt ──────────────────────────────────── */
fetch('DawnPrompt.txt?v=' + Date.now())
  .then(function(r) { return r.text(); })
  .then(function(t) { dawnPrompt = t.trim(); })
  .catch(function() { dawnPrompt = null; });

/* ── Speech ───────────────────────────────────────────────── */
function speakDawn() {
  var text = dawnPrompt || "Hi, I'm Dawn. See you later.";
  if (!selectedVoice) resolveVoice();

  // Fix for Chromium bug #509488: Chrome GC can destroy the utterance
  // object mid-speech, killing audio. Storing on window keeps a strong
  // reference the GC won't collect.
  window._dawnUtterance = new SpeechSynthesisUtterance(', ' + text);
  window._dawnUtterance.lang = 'en-GB';
  window._dawnUtterance.rate = 0.95;
  if (selectedVoice) window._dawnUtterance.voice = selectedVoice;
  speechSynthesis.speak(window._dawnUtterance);
}

/* ── Page visit counter ───────────────────────────────────── */
ref.set({ visits: FV.increment(1) }, { merge: true })
  .then(function() { return ref.get(); })
  .then(function(snap) {
    visitEl.textContent = (snap.data() || {}).visits || 0;
  })
  .catch(function() {
    setTimeout(function() {
      ref.get().then(function(snap) {
        visitEl.textContent = (snap.data() || {}).visits || 0;
      });
    }, 3000);
  });

/* ── Hi button ────────────────────────────────────────────── */
document.getElementById('hiBtn').addEventListener('click', function() {
  ref.set({ clicks: FV.increment(1) }, { merge: true })
    .then(function() { return ref.get(); })
    .then(function(snap) {
      clickEl.textContent = (snap.data() || {}).clicks || 0;
    });

  speakDawn();
});
