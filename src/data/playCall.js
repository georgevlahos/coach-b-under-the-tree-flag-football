import { formatRoute, getRouteByNumber } from './routes.js'

/**
 * @typedef {Object} Assignment
 * @property {'route' | 'play' | 'motion'} kind
 * @property {string} label - player-facing answer text
 * @property {number} [routeNumber]
 * @property {string} [playName]
 * @property {{ direction: string, routeNumber?: number }} [motion]
 */

/**
 * @typedef {Object} ParsedPlayCall
 * @property {string} call
 * @property {string} formationId
 * @property {string} formationName
 * @property {Record<string, Assignment>} assignments - X L R Z H
 * @property {string} audioCall
 */

const FORMATION_MAP = {
  spread: { id: 'spread', name: 'Spread' },
  'trips left': { id: 'trips-left', name: 'Trips Left' },
  'trips right': { id: 'trips-right', name: 'Trips Right' },
}

const MOTION_NAMES = {
  hazer: 'H',
  lazer: 'L',
  razer: 'R',
  xavier: 'X',
  zazer: 'Z',
}

/**
 * Parse a Coach B play call string into per-position assignments.
 * @param {string} call
 * @returns {ParsedPlayCall}
 */
export function parsePlayCall(call) {
  const original = call.trim()
  const normalized = original.replace(/\s+/g, ' ')

  const formMatch = normalized.match(/^(Spread|Trips Left|Trips Right)\b/i)
  if (!formMatch) throw new Error(`Unknown formation in call: ${call}`)

  const formationName = titleCaseFormation(formMatch[1])
  const formation = FORMATION_MAP[formationName.toLowerCase()]
  let rest = normalized.slice(formMatch[0].length).trim()

  /** @type {Record<string, Assignment>} */
  const assignments = {
    X: null,
    L: null,
    R: null,
    Z: null,
    H: null,
  }

  if (formation.id === 'spread') {
    const m = rest.match(/^(\d)\s*-\s*(\d)\b/)
    if (!m) throw new Error(`Expected Spread A-B in: ${call}`)
    const a = Number(m[1])
    const b = Number(m[2])
    assignments.X = routeAssignment(a)
    assignments.Z = routeAssignment(a)
    assignments.L = routeAssignment(b)
    assignments.R = routeAssignment(b)
    rest = rest.slice(m[0].length).replace(/^[,\s]+/, '')
  } else {
    // Trips: accept 193 or 1-9-3 (dashes optional — teach with dashes, quiz may mix)
    const m = rest.match(/^(\d)\s*-?\s*(\d)\s*-?\s*(\d)\b/)
    if (!m) throw new Error(`Expected Trips A-B-C in: ${call}`)
    const a = Number(m[1])
    const b = Number(m[2])
    const c = Number(m[3])
    assignments.X = routeAssignment(a)
    assignments.Z = routeAssignment(a)
    if (formation.id === 'trips-left') {
      assignments.L = routeAssignment(b)
      assignments.R = routeAssignment(c)
    } else {
      assignments.R = routeAssignment(b)
      assignments.L = routeAssignment(c)
    }
    rest = rest.slice(m[0].length).replace(/^[,\s]+/, '')
  }

  applyTags(rest, assignments)

  if (!assignments.H) {
    throw new Error(`H must be tagged in call: ${call}`)
  }

  return {
    call: original,
    formationId: formation.id,
    formationName: formation.name,
    assignments,
    audioCall: speakableCall(original),
  }
}

/** @param {string} rest @param {Record<string, Assignment>} assignments */
function applyTags(rest, assignments) {
  if (!rest) return

  // Motion: Hazer Left-3 / Xavier Right 3
  const motionRe =
    /\b(Hazer|Lazer|Razer|Xavier|Zazer)\s+(Left|Right)\s*-?\s*(\d)\b/gi
  let m
  while ((m = motionRe.exec(rest))) {
    const pos = MOTION_NAMES[m[1].toLowerCase()]
    const direction = m[2].toLowerCase()
    const routeNumber = Number(m[3])
    assignments[pos] = motionAssignment(direction, routeNumber)
  }

  // H fake run
  const fakeRunRe = /\bH\s*-?\s*fake\s+run\s+(left|right)\b/gi
  while ((m = fakeRunRe.exec(rest))) {
    assignments.H = playAssignment(`fake run ${m[1].toLowerCase()}`)
  }

  // Position triple tag: X-X-X 2
  const tripleRe = /\b([XLRZH])(?:-\1){2}\s+(\d)\b/gi
  while ((m = tripleRe.exec(rest))) {
    assignments[m[1].toUpperCase()] = routeAssignment(Number(m[2]))
  }

  // Play tags: L-Reverse, R-Fake Reverse
  const playTagRe = /\b([XLRZH])\s*-?\s*(Fake\s+Reverse|Reverse)\b/gi
  while ((m = playTagRe.exec(rest))) {
    const name = m[2].toLowerCase().includes('fake') ? 'Fake Reverse' : 'Reverse'
    assignments[m[1].toUpperCase()] = playAssignment(name)
  }

  // Simple route tags: H-0, X-2, Z8, L-8 (avoid eating already-matched motion text)
  const simpleRe = /\b([XLRZH])\s*-?\s*(\d)\b/gi
  while ((m = simpleRe.exec(rest))) {
    // Skip if this digit is part of a motion tag (already handled) — overwrite is OK for explicit tags
    const pos = m[1].toUpperCase()
    // Don't override motion if the match is the trailing digit of Hazer Left-3 style already set —
    // explicit H-3 after motion should still win when written as H-3
    assignments[pos] = routeAssignment(Number(m[2]))
  }
}

function routeAssignment(n) {
  const route = getRouteByNumber(n)
  return {
    kind: 'route',
    routeNumber: n,
    label: route ? formatRoute(route) : String(n),
  }
}

function playAssignment(playName) {
  return {
    kind: 'play',
    playName,
    label: playName,
  }
}

function motionAssignment(direction, routeNumber) {
  const route = getRouteByNumber(routeNumber)
  return {
    kind: 'motion',
    routeNumber,
    motion: { direction, routeNumber },
    label: `motion ${direction} + ${route ? formatRoute(route) : routeNumber}`,
  }
}

function titleCaseFormation(s) {
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Spoken forms for position IDs — avoids TTS saying "capital R" etc. */
const POSITION_LETTER_SAY = {
  // Keep H as H (Aitch/Halfback were harder to hear on iPhone)
  H: 'H',
  L: 'El',
  R: 'Are',
  X: 'Ex',
  Z: 'Zee',
}

/** Make TTS clearer with short pauses between formation, numbers, and tags */
export function speakableCall(call) {
  return String(call)
    .replace(/\bHazer\b/gi, 'Hazer')
    .replace(/\bLazer\b/gi, 'Lazer')
    .replace(/\bRazer\b/gi, 'Razer')
    .replace(/\bXavier\b/gi, 'Xavier')
    .replace(/\bZazer\b/gi, 'Zazer')
    // Pause after formation name
    .replace(/^(Spread|Trips Left|Trips Right)\b/i, '$1 ...')
    // Route number blocks: pause between each digit slot
    .replace(/\b(\d)\s*-\s*(\d)\s*-\s*(\d)\b/g, '$1 ... $2 ... $3')
    .replace(/(\d)-(\d)/g, '$1 ... $2')
    .replace(/\b(\d{3})\b/g, (digits) => digits.split('').join(' ... '))
    // Pause before a named tag that follows a number (no comma in the written call)
    .replace(/(\d)\s+(?=[A-Za-z])/g, '$1 ... ')
    // Position / motion tags: pause before the route # or named play
    .replace(/\b([HLRXZ])-(\d)\b/gi, '$1 ... $2')
    .replace(/\b([HLRXZ])-([A-Za-z][\w]*(?:\s+[\w]+)*)/gi, '$1 ... $2')
    .replace(/\b(Left|Right)-(\d)\b/gi, '$1 ... $2')
    // Written commas between tags → same slot pause
    .replace(/,\s*/g, ' ... ')
    .replace(/(?:\s*\.\.\.\s*)+/g, ' ... ')
    // Position letters as their own slot — phonetic so voices don't say "capital …"
    .replace(/\b([HLRXZ])\b/gi, (_, ch) => POSITION_LETTER_SAY[ch.toUpperCase()] || ch)
    // Older audio strings may still say "Aitch" / "Halfback"
    .replace(/\bAitch\b/gi, 'H')
    .replace(/\bHalfback\b/gi, 'H')
    .trim()
}

/**
 * Teaching form: Trips route digits written with dashes (1-9-3).
 * @param {string} call
 */
export function withTripsDashes(call) {
  return String(call).replace(
    /\b(Trips (?:Left|Right)\s+)(\d)(\d)(\d)\b/i,
    (_, head, a, b, c) => `${head}${a}-${b}-${c}`,
  )
}

/**
 * Compact Trips digits without dashes (193) — useful for quiz variety.
 * @param {string} call
 */
export function withoutTripsDashes(call) {
  return String(call).replace(
    /\b(Trips (?:Left|Right)\s+)(\d)\s*-\s*(\d)\s*-\s*(\d)\b/i,
    (_, head, a, b, c) => `${head}${a}${b}${c}`,
  )
}

/**
 * @param {ParsedPlayCall} parsed
 * @param {string} positionId
 */
export function assignmentFor(parsed, positionId) {
  return parsed.assignments[positionId]
}

const MOTION_BY_POS = {
  H: 'Hazer',
  L: 'Lazer',
  R: 'Razer',
  X: 'Xavier',
  Z: 'Zazer',
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapCallRange(call, start, end) {
  return (
    escapeHtml(call.slice(0, start)) +
    `<span class="play-call-pos-cue">${escapeHtml(call.slice(start, end))}</span>` +
    escapeHtml(call.slice(end))
  )
}

/**
 * Highlight the part of a play call that assigns a position (tag or formation digit).
 * @param {string} call
 * @param {string} positionId
 * @param {string} [formationId]
 * @returns {string} HTML-safe call with cue wrapped in .play-call-pos-cue
 */
export function highlightCallForPosition(call, positionId, formationId) {
  const pos = String(positionId || '').toUpperCase()
  if (!call || !pos) return escapeHtml(call || '')

  /** @type {RegExp[]} */
  const patterns = []
  const motionName = MOTION_BY_POS[pos]
  if (motionName) {
    patterns.push(new RegExp(`\\b${motionName}\\s+(?:Left|Right)\\s*-?\\s*\\d\\b`, 'i'))
  }
  if (pos === 'H') {
    patterns.push(/\bH\s*-?\s*fake\s+run\s+(?:left|right)\b/i)
  }
  patterns.push(new RegExp(`\\b${pos}\\s*-?\\s*(?:Fake\\s+Reverse|Reverse)\\b`, 'i'))
  patterns.push(new RegExp(`\\b${pos}(?:-${pos}){2}\\s+\\d\\b`, 'i'))
  patterns.push(new RegExp(`\\b${pos}\\s*-?\\s*\\d\\b`, 'i'))

  for (const re of patterns) {
    const m = call.match(re)
    if (m?.index != null) {
      return wrapCallRange(call, m.index, m.index + m[0].length)
    }
  }

  const formId = formationId || (call.match(/^Trips Left\b/i) ? 'trips-left' : call.match(/^Trips Right\b/i) ? 'trips-right' : 'spread')

  if (formId === 'spread') {
    const m = call.match(/(\d)\s*-\s*(\d)/)
    if (m?.index != null) {
      if (pos === 'X' || pos === 'Z') {
        return wrapCallRange(call, m.index, m.index + 1)
      }
      if (pos === 'L' || pos === 'R') {
        const offset = m[0].lastIndexOf(m[2])
        return wrapCallRange(call, m.index + offset, m.index + offset + 1)
      }
    }
  } else {
    // 193 or 1-9-3
    const m = call.match(/\b(\d)\s*-?\s*(\d)\s*-?\s*(\d)\b/)
    if (m?.index != null) {
      let which = -1
      if (pos === 'X' || pos === 'Z') which = 1
      else if (formId === 'trips-left') {
        if (pos === 'L') which = 2
        else if (pos === 'R') which = 3
      } else if (pos === 'R') which = 2
      else if (pos === 'L') which = 3

      if (which >= 1) {
        const full = m[0]
        let offset = 0
        if (which === 1) {
          offset = 0
        } else if (which === 2) {
          offset = full.indexOf(m[2], 1)
        } else {
          offset = full.lastIndexOf(m[3])
        }
        return wrapCallRange(call, m.index + offset, m.index + offset + 1)
      }
    }
  }

  return escapeHtml(call)
}
