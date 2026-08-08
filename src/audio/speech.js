/** Web Speech API wrapper — ready for audio quiz mode */

let enabled = false

export function isSpeechSupported() {
  return 'speechSynthesis' in window
}

export function isAudioModeEnabled() {
  return enabled
}

export function setAudioMode(on) {
  enabled = on && isSpeechSupported()
  if (!enabled && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  return enabled
}

/** @param {string} text @param {{ rate?: number, pitch?: number }} [opts] */
export function speak(text, opts = {}) {
  if (!enabled || !isSpeechSupported()) return Promise.resolve()

  return new Promise((resolve) => {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = opts.rate ?? 0.92
    utter.pitch = opts.pitch ?? 1.05
    utter.onend = () => resolve()
    utter.onerror = () => resolve()
    window.speechSynthesis.speak(utter)
  })
}

export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}

/** Speak a quiz prompt — uses audioPrompt if available */
export function speakQuestion(question) {
  const text = question.audioPrompt || question.prompt
  return speak(text)
}

/** Speak Coach B's play call */
export function speakPlayCall(play) {
  return speak(play.audioCall, { rate: 0.88 })
}

export function speakFeedback(correct) {
  const phrases = correct
    ? ['Great job!', 'Nailed it!', 'That\'s right!', 'You got it!', 'Awesome!']
    : ['Not quite — keep learning!', 'Close! Check the explanation.', 'You\'ll get it next time!']
  const text = phrases[Math.floor(Math.random() * phrases.length)]
  return speak(text)
}
