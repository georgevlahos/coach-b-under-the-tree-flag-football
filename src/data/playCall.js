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
    const m = rest.match(/^(\d)(\d)(\d)\b/)
    if (!m) throw new Error(`Expected Trips ABC in: ${call}`)
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

/** Make TTS a bit clearer */
export function speakableCall(call) {
  return call
    .replace(/\bHazer\b/gi, 'Hazer')
    .replace(/\bLazer\b/gi, 'Lazer')
    .replace(/\bRazer\b/gi, 'Razer')
    .replace(/\bXavier\b/gi, 'Xavier')
    .replace(/\bZazer\b/gi, 'Zazer')
    .replace(/(\d)-(\d)/g, '$1 $2')
    .replace(/\b(\d{3})\b/g, (digits) => digits.split('').join(' '))
}

/**
 * @param {ParsedPlayCall} parsed
 * @param {string} positionId
 */
export function assignmentFor(parsed, positionId) {
  return parsed.assignments[positionId]
}
