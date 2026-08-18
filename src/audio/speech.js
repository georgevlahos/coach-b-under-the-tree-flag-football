/** Web Speech API wrapper — warm, friendly US English coach voice */

import { speakableCall } from '../data/playCall.js'

let enabled = false
/** @type {SpeechSynthesisVoice | null} */
let preferredVoice = null

/** Desktop / non-iOS defaults */
const DEFAULT_RATE = 0.88
const PLAY_CALL_RATE = 0.78
const FEEDBACK_RATE = 0.92
const DEFAULT_PITCH = 1.0
const PLAY_CALL_PITCH = 1.0
const PLAY_CALL_SLOT_GAP_MS = 120

/**
 * iOS Safari speaks slower/mufflier at the same rate values — use a clearer profile.
 * Also prefer one continuous utterance (comma pauses) over many tiny slots.
 */
const IOS_DEFAULT_RATE = 1.0
const IOS_PLAY_CALL_RATE = 0.98
const IOS_FEEDBACK_RATE = 1.05
const IOS_PLAY_CALL_SLOT_GAP_MS = 70

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** iPhone / iPad (incl. iPadOS desktop UA) */
function isAppleMobile() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  // iPadOS 13+ can report as MacIntel with touch
  return navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1
}

function ratesForDevice() {
  if (isAppleMobile()) {
    return {
      defaultRate: IOS_DEFAULT_RATE,
      playCallRate: IOS_PLAY_CALL_RATE,
      feedbackRate: IOS_FEEDBACK_RATE,
      playCallPitch: 1.0,
      slotGapMs: IOS_PLAY_CALL_SLOT_GAP_MS,
      /** One utterance reads clearer than many slow micro-slots on Safari */
      playCallSingleUtterance: true,
    }
  }
  return {
    defaultRate: DEFAULT_RATE,
    playCallRate: PLAY_CALL_RATE,
    feedbackRate: FEEDBACK_RATE,
    playCallPitch: PLAY_CALL_PITCH,
    slotGapMs: PLAY_CALL_SLOT_GAP_MS,
    playCallSingleUtterance: false,
  }
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
 * On Apple devices, favor Enhanced / clearer system voices over muffled compact ones.
 */
function scoreVoice(voice) {
  const name = voice.name || ''
  const lang = voice.lang || ''
  if (!/^en([-_]|$)/i.test(lang)) return -100

  // Skip novelty / robotic Mac voices (compact is especially muffled on iOS)
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
  // Enhanced / natural engines sound much clearer than compact system voices
  if (/natural|premium|enhanced|neural|wavenet|studio|super|quality/i.test(name)) {
    score += 40
  }
  if (/en-US|en_US|english \(us\)|english united states|american/i.test(`${lang} ${name}`)) {
    score += 20
  }
  // Soft preference for names that usually sound clearer / friendlier on Apple & Google
  if (/samantha|nicky|ava|allison|zoe|aria|jenny|salli|joanna/i.test(name)) {
    score += 20
  }
  // On iPhone, Nicky / Samantha Enhanced tend to cut through better than soft defaults
  if (isAppleMobile() && /nicky|samantha|ava/i.test(name)) {
    score += 15
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
  const profile = ratesForDevice()

  return new Promise((resolve) => {
    if (opts.cancel !== false) window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = opts.rate ?? profile.defaultRate
    utter.pitch = opts.pitch ?? DEFAULT_PITCH
    // iOS sometimes starts quiet until a speak() after a user gesture — keep volume max
    utter.volume = 1
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
 * Speak a play call with short pauses between formation / numbers / tags.
 * On iOS Safari: one clearer utterance (comma pauses) + faster rate.
 * @param {string} text
 * @param {{ force?: boolean }} [opts]
 */
async function speakPlayCallText(text, opts = {}) {
  const parts = String(text)
    .split(/\s*\.\.\.\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!parts.length) return

  const profile = ratesForDevice()
  const speakOpts = {
    rate: profile.playCallRate,
    pitch: profile.playCallPitch,
    force: opts.force,
  }

  // iOS: continuous call with comma pauses — avoids muffled micro-utterances
  if (profile.playCallSingleUtterance || parts.length === 1) {
    return speak(parts.join(', '), speakOpts)
  }

  if (window.speechSynthesis) window.speechSynthesis.cancel()
  for (let i = 0; i < parts.length; i++) {
    await speak(parts[i], { ...speakOpts, cancel: false })
    if (i < parts.length - 1) await delay(profile.slotGapMs)
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
  const profile = ratesForDevice()
  const isPlayCall = question.category === 'play-calls'
  if (isPlayCall) return speakPlayCallText(speakableCall(text, { preferPlainH: isAppleMobile() }))
  return speak(text, {
    rate: profile.defaultRate,
    pitch: DEFAULT_PITCH,
  })
}

/** Speak Coach B's play call — accepts a play object or raw string */
export function speakPlayCall(playOrText, opts = {}) {
  // Prefer original call text so speakable forms stay up to date
  const raw =
    typeof playOrText === 'string'
      ? playOrText
      : playOrText?.call || playOrText?.audioCall
  if (!raw) return Promise.resolve()
  // Always normalize so position letters never say "capital R" etc.
  return speakPlayCallText(speakableCall(raw, { preferPlainH: isAppleMobile() }), {
    force: true,
    ...opts,
  })
}

/** Replay a question's audio prompt (works even if audio mode is off) */
export function replayQuestionAudio(question) {
  if (question?.category === 'guess-the-play') return Promise.resolve()
  const raw = question?.audioPrompt || question?.prompt || ''
  const text = String(raw).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return Promise.resolve()
  const profile = ratesForDevice()
  const isPlayCall = question?.category === 'play-calls'
  if (isPlayCall) {
    return speakPlayCallText(speakableCall(text, { preferPlainH: isAppleMobile() }), { force: true })
  }
  return speak(text, {
    rate: profile.defaultRate,
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
  const profile = ratesForDevice()
  return speak(text, { rate: profile.feedbackRate })
}
