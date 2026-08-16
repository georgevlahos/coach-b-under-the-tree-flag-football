/** Web Speech API wrapper — warm, friendly US English coach voice */

import { speakableCall } from '../data/playCall.js'

let enabled = false
/** @type {SpeechSynthesisVoice | null} */
let preferredVoice = null

const DEFAULT_RATE = 0.78
/** Slightly slower — calm sideline cadence for play calls */
const PLAY_CALL_RATE = 0.551
const FEEDBACK_RATE = 0.82
const DEFAULT_PITCH = 1.0
/** Natural pitch for a clear, friendly play-call voice */
const PLAY_CALL_PITCH = 1.05
/** Extra hush between play-call slots (formation / numbers / tags) — does not change speaking rate */
const PLAY_CALL_SLOT_GAP_MS = 180

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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

/**
 * Prefer a warm US-English female coach voice.
 * Note: browsers don’t expose a real “Chicago accent” voice — we pick the
 * warmest available American English female option on the device.
 */
function scoreVoice(voice) {
  const name = voice.name || ''
  const lang = voice.lang || ''
  if (!/^en([-_]|$)/i.test(lang)) return -100

  // Skip novelty / robotic Mac voices
  if (/compact|eloquence|novelty|whisper|zarvox|trinoids|bad news|good news|boing|bubbles|cellos|albert|bahh|bells|boiler|fred|junior|pipe organ|princess|ralph|superstar|deranged|hysterical|jester|organ|sinbad|whisper/i.test(name)) {
    return -50
  }

  // Prefer American English; down-rank UK / AU / IN for play-call feel
  if (/en-GB|en_GB|en-AU|en_AU|en-IN|en_IN|en-IE|en_IE|en-ZA|en_ZA/i.test(lang) || /british|australian|irish|indian|uk english|english united kingdom/i.test(name)) {
    return -20
  }

  let score = 10

  // Warm US female voices commonly available on Apple / Google / Microsoft
  if (/samantha|nicky|ava|allison|susan|zoe|kathy|stephanie|joanna|salli|kimberly|kendra|ivy|jenny|aria|sara|michelle|grandma/i.test(name)) {
    score += 55
  }
  // Explicit female tags
  if (/female|woman|\(female\)/i.test(name)) {
    score += 50
  }
  // Enhanced / natural engines sound much warmer than compact system voices
  if (/natural|premium|enhanced|neural|wavenet|studio|super|quality/i.test(name)) {
    score += 30
  }
  if (/en-US|en_US|english \(us\)|english united states|american/i.test(`${lang} ${name}`)) {
    score += 20
  }
  // Soft preference for names that usually sound clearer / friendlier on Apple & Google
  if (/samantha|nicky|ava|allison|zoe|aria|jenny|salli|joanna/i.test(name)) {
    score += 20
  }
  // Down-rank male coach voices so they don’t win
  if (/male|man|\(male\)|aaron|alex|tom|nathan|evan|matthew|guy|davis|tony|justin|joey|noah|bruce|gordon|lee|rocko|reed|eddy|grandpa/i.test(name) && !/female|woman/i.test(name)) {
    score -= 45
  }
  if (voice.localService) score += 5

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

/** Currently selected coach voice name (for debugging / UI). */
export function getPreferredVoiceName() {
  return preferredVoice?.name || null
}

/** List scored US-leaning voices so we can try alternatives later. */
export function listCoachVoices() {
  if (!isSpeechSupported()) return []
  return window.speechSynthesis
    .getVoices()
    .map((v) => ({ name: v.name, lang: v.lang, score: scoreVoice(v), local: v.localService }))
    .filter((v) => v.score > 0)
    .sort((a, b) => b.score - a.score)
}

/** Force a specific system voice by name (partial match OK). */
export function setPreferredVoiceByName(namePart) {
  if (!isSpeechSupported() || !namePart) return null
  const needle = String(namePart).toLowerCase()
  const match = window.speechSynthesis.getVoices().find((v) => v.name.toLowerCase().includes(needle))
  if (match) preferredVoice = match
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

/** @param {string} text @param {{ rate?: number, pitch?: number, force?: boolean, cancel?: boolean }} [opts] */
export async function speak(text, opts = {}) {
  if ((!enabled && !opts.force) || !isSpeechSupported()) return

  await ensureVoicesReady()
  const voice = preferredVoice || pickFriendlyVoice()

  return new Promise((resolve) => {
    if (opts.cancel !== false) window.speechSynthesis.cancel()
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

/**
 * Speak a play call slot-by-slot with a short gap between parts.
 * Rate/pitch stay the same — only the silence between slots grows.
 * @param {string} text
 * @param {{ force?: boolean }} [opts]
 */
async function speakPlayCallText(text, opts = {}) {
  const parts = String(text)
    .split(/\s*\.\.\.\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!parts.length) return

  const speakOpts = {
    rate: PLAY_CALL_RATE,
    pitch: PLAY_CALL_PITCH,
    force: opts.force,
  }

  if (parts.length === 1) {
    return speak(parts[0], speakOpts)
  }

  if (window.speechSynthesis) window.speechSynthesis.cancel()
  for (let i = 0; i < parts.length; i++) {
    await speak(parts[i], { ...speakOpts, cancel: false })
    if (i < parts.length - 1) await delay(PLAY_CALL_SLOT_GAP_MS)
  }
}

export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}

/** Speak a quiz prompt — uses audioPrompt if available (play calls: call only) */
export function speakQuestion(question) {
  if (question?.category === 'guess-the-play') return Promise.resolve()
  const raw = question.audioPrompt || question.prompt || ''
  const text = String(raw).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return Promise.resolve()
  const isPlayCall = question.category === 'play-calls'
  if (isPlayCall) return speakPlayCallText(speakableCall(text))
  return speak(text, {
    rate: DEFAULT_RATE,
    pitch: DEFAULT_PITCH,
  })
}

/** Speak Coach B's play call — accepts a play object or raw string */
export function speakPlayCall(playOrText, opts = {}) {
  const raw = typeof playOrText === 'string' ? playOrText : playOrText?.audioCall
  if (!raw) return Promise.resolve()
  // Always normalize so position letters never say "capital R" etc.
  return speakPlayCallText(speakableCall(raw), { force: true, ...opts })
}

/** Replay a question's audio prompt (works even if audio mode is off) */
export function replayQuestionAudio(question) {
  if (question?.category === 'guess-the-play') return Promise.resolve()
  const raw = question?.audioPrompt || question?.prompt || ''
  const text = String(raw).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return Promise.resolve()
  const isPlayCall = question?.category === 'play-calls'
  if (isPlayCall) return speakPlayCallText(speakableCall(text), { force: true })
  return speak(text, {
    rate: DEFAULT_RATE,
    pitch: DEFAULT_PITCH,
    force: true,
  })
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
