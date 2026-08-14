/** Web Speech API wrapper — friendly Coach B voice */

let enabled = false
/** @type {SpeechSynthesisVoice | null} */
let preferredVoice = null

const DEFAULT_RATE = 0.78
const PLAY_CALL_RATE = 0.72
const FEEDBACK_RATE = 0.82
const DEFAULT_PITCH = 1.1

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
  if (enabled) refreshPreferredVoice()
  return enabled
}

/** Prefer warm, natural English voices over robotic defaults */
function scoreVoice(voice) {
  const name = voice.name || ''
  const lang = voice.lang || ''
  if (!/^en([-_]|$)/i.test(lang)) return -100
  // Skip novelty / robotic Mac voices
  if (/compact|eloquence|novelty|whisper|zarvox|trinoids|bad news|good news|boing|bubbles|cellos|albert|bahh|bells|boiler|fred|junior|pipe organ|princess|ralph|superstar|deranged|hysterical|jester|organ|sinbad|whisper/i.test(name)) {
    return -50
  }

  let score = 10
  if (/samantha|karen|moira|fiona|tessa|victoria|karen|ava|allison|susan|zoe|aria|jenny|sara|natasha|google uk english female|google us english/i.test(name)) score += 40
  if (/natural|premium|enhanced|neural|wavenet|studio/i.test(name)) score += 25
  if (/female|woman/i.test(name)) score += 8
  if (voice.localService) score += 5
  if (/en-US|en_US/i.test(lang)) score += 3
  return score
}

function pickFriendlyVoice() {
  if (!isSpeechSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null
}

function refreshPreferredVoice() {
  preferredVoice = pickFriendlyVoice()
  return preferredVoice
}

function ensureVoicesReady() {
  if (!isSpeechSupported()) return Promise.resolve()
  if (window.speechSynthesis.getVoices().length) {
    refreshPreferredVoice()
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const done = () => {
      refreshPreferredVoice()
      resolve()
    }
    window.speechSynthesis.addEventListener('voiceschanged', done, { once: true })
    // Fallback if voiceschanged never fires
    setTimeout(done, 400)
  })
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshPreferredVoice()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    refreshPreferredVoice()
  })
}

/** @param {string} text @param {{ rate?: number, pitch?: number, force?: boolean }} [opts] */
export async function speak(text, opts = {}) {
  if ((!enabled && !opts.force) || !isSpeechSupported()) return

  await ensureVoicesReady()
  const voice = preferredVoice || pickFriendlyVoice()

  return new Promise((resolve) => {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = opts.rate ?? DEFAULT_RATE
    utter.pitch = opts.pitch ?? DEFAULT_PITCH
    if (voice) {
      utter.voice = voice
      utter.lang = voice.lang || 'en-US'
    } else {
      utter.lang = 'en-US'
    }
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
  const isPlayCall = question.category === 'play-calls' || Boolean(question.meta?.playId)
  return speak(text, { rate: isPlayCall ? PLAY_CALL_RATE : DEFAULT_RATE })
}

/** Speak Coach B's play call — accepts a play object or raw string */
export function speakPlayCall(playOrText, opts = {}) {
  const text = typeof playOrText === 'string' ? playOrText : playOrText?.audioCall
  if (!text) return Promise.resolve()
  return speak(text, { rate: PLAY_CALL_RATE, ...opts })
}

/** Replay a question's audio prompt (works even if audio mode is off) */
export function replayQuestionAudio(question) {
  const raw = question?.audioPrompt || question?.prompt || ''
  const text = String(raw).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return Promise.resolve()
  const isPlayCall = question?.category === 'play-calls' || Boolean(question?.meta?.playId)
  return speak(text, { rate: isPlayCall ? PLAY_CALL_RATE : DEFAULT_RATE, force: true })
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
  return speak(text, { rate: FEEDBACK_RATE })
}
