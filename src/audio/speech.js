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

/** @param {string} text @param {{ rate?: number, pitch?: number, force?: boolean }} [opts] */
export function speak(text, opts = {}) {
  if ((!enabled && !opts.force) || !isSpeechSupported()) return Promise.resolve()

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

/** Speak a quiz prompt — uses audioPrompt if available (play calls: call only) */
export function speakQuestion(question) {
  const raw = question.audioPrompt || question.prompt || ''
  const text = String(raw).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return speak(text)
}

/** Speak Coach B's play call — accepts a play object or raw string */
export function speakPlayCall(playOrText, opts = {}) {
  const text = typeof playOrText === 'string' ? playOrText : playOrText?.audioCall
  if (!text) return Promise.resolve()
  return speak(text, { rate: 0.88, ...opts })
}

/** Replay a question's audio prompt (works even if audio mode is off) */
export function replayQuestionAudio(question) {
  const raw = question?.audioPrompt || question?.prompt || ''
  const text = String(raw).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return Promise.resolve()
  return speak(text, { rate: 0.88, force: true })
}

/** @param {boolean} correct @param {number} [consecutiveCorrect] */
export function speakFeedback(correct, consecutiveCorrect = 0) {
  let phrases
  if (!correct) {
    phrases = ['Not quite — keep learning!', 'Close! Check the explanation.', 'You\'ll get it next time!']
  } else if (consecutiveCorrect >= 5) {
    phrases = ['On fire!', 'Incredible streak!', 'You are rolling!']
  } else if (consecutiveCorrect >= 3) {
    phrases = ['Awesome streak!', 'Great job!', 'Keep it going!']
  } else if (consecutiveCorrect >= 2) {
    phrases = ['Great job!', 'Nailed it again!', 'You got it!']
  } else {
    phrases = ['Nice!', 'That\'s right!', 'You got it!']
  }
  const text = phrases[Math.floor(Math.random() * phrases.length)]
  return speak(text)
}
