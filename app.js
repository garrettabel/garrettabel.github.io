/* app.js - v3
 * Realtonomy - Dawn voice assistant
 * Counters + Firebase removed (DB locked down). Voice feature unchanged.
 */

/* -- Voice selection -- */
var FEMALE_VOICES = [
  'Google UK English Female','Microsoft Libby','Microsoft Mia','Microsoft Sonia',
  'Microsoft Hazel','Serena','Martha','Microsoft Zira','Microsoft Jenny',
  'Microsoft Aria','Microsoft Michelle','Microsoft Monica','Samantha',
  'Victoria','Karen','Moira','Tessa'
];

var MALE_VOICES = [
  'David','Mark','Daniel','George','James','Ryan','Thomas',
  'Eric','Guy','Richard','Fred','Alex','Bruce','Junior','Ralph','Albert'
];

function pickVoice(voices) {
  // 1. Priority: exact female whitelist match
  for (var i = 0; i < FEMALE_VOICES.length; i++) {
    for (var j = 0; j < voices.length; j++) {
      if (voices[j].name.indexOf(FEMALE_VOICES[i]) === 0) {
        return voices[j];
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
      return voices[k];
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
      return voices[n];
    }
  }
  return null;
}

// Promise resolves with the chosen voice once voices are available.
var voiceReady = new Promise(function(resolve) {
  var voices = speechSynthesis.getVoices();
  if (voices.length > 0) {
    resolve(pickVoice(voices));
  } else {
    speechSynthesis.onvoiceschanged = function() {
      speechSynthesis.onvoiceschanged = null;
      resolve(pickVoice(speechSynthesis.getVoices()));
    };
  }
});

/* -- Load DawnPrompt.txt -- */
var promptReady = fetch('DawnPrompt.txt?v=' + Date.now())
  .then(function(r) { return r.text(); })
  .then(function(t) { return t.trim(); })
  .catch(function() { return "Hi, I'm Dawn. See you later."; });

/* -- Speech -- */
function speakDawn() {
  Promise.all([voiceReady, promptReady]).then(function(results) {
    var voice = results[0];
    var text = results[1];

    // Store on window to prevent GC destroying the utterance mid-speech.
    window._dawnUtterance = new SpeechSynthesisUtterance(text);
    window._dawnUtterance.lang = 'en-GB';
    window._dawnUtterance.rate = 0.95;
    if (voice) window._dawnUtterance.voice = voice;
    speechSynthesis.speak(window._dawnUtterance);
  });
}

/* -- Hi button -- */
document.getElementById('hiBtn').addEventListener('click', function() {
  speakDawn();
});
