import { parsePlayCall } from './playCall.js'

/** Learn → Play Call Examples (teaching set). */
const LEARN_CALLS = [
  'Spread 0-1, H-0',
  'Spread 2-3, H-9',
  'Spread 2-7, H-0, Z-8',
  'Spread 9-0, H-3, L-8',
  'Spread 2-3, H-8, R-0',
  'Spread 8-1, H-3, X-7',
  'Spread 9-1, H-5, Z-Reverse',
  'Trips Right 1-9-3 Hazer Left-3, X-2',
  'Trips Right 2-2-2, H-3, X-8',
  'Trips Right 9-1-1, Hazer Right-3, L-Reverse',
  'Trips Right 9-1-0, Xavier Right-3, H-fake run left',
  'Trips Left 1-9-3 Hazer Right-3, Z-2',
  'Trips Left 2-2-2, H-3, Z-8',
  'Trips Left 9-1-1, Hazer Right-3, R-Fake Reverse',
  'Trips Left 9-1-0, Zazer Left-3, H-fake run right',
]

/**
 * Guess the Play bank — mostly new calls (not the Learn set).
 * Prefer runnable plays (no motion / fake-run) so the animation matches the call.
 * A few Learn calls are included so the pool isn't completely separate.
 */
const GUESS_CALLS = [
  // Spread extras
  'Spread 1-2, H-0',
  'Spread 3-8, H-1',
  'Spread 5-2, H-9, L-0',
  'Spread 7-1, H-3, R-8',
  'Spread 0-8, H-5, X-2',
  'Spread 4-9, H-0, Z-1',
  'Spread 6-3, H-8',
  'Spread 8-0, H-2, L-Reverse',
  'Spread 1-5, H-9, Z-7',
  'Spread 3-0, H-1, X-Reverse',
  'Spread 9-4, H-0, R-2',
  'Spread 2-8, H-5',
  'Spread 4-1, H-3, Z-Reverse',
  'Spread 7-0, H-8, L-9',
  // Trips Left extras
  'Trips Left 3-8-1, H-0',
  'Trips Left 5-2-9, H-3, R-0',
  'Trips Left 0-7-2, H-8, Z-1',
  'Trips Left 8-1-4, H-0, L-Reverse',
  'Trips Left 2-5-0, H-9',
  'Trips Left 4-0-3, H-1, X-8',
  'Trips Left 7-9-1, H-5',
  'Trips Left 1-3-8, H-0, Z-Reverse',
  // Trips Right extras
  'Trips Right 3-1-8, H-0',
  'Trips Right 7-2-2, H-5, L-8',
  'Trips Right 0-9-1, H-3, X-2',
  'Trips Right 4-0-5, H-8',
  'Trips Right 1-5-9, H-0, Z-Reverse',
  'Trips Right 8-3-0, H-1, R-Reverse',
  'Trips Right 2-7-4, H-9',
  'Trips Right 5-1-0, H-3, L-Reverse',
  // Light overlap with Learn (runnable only)
  'Spread 2-3, H-9',
  'Spread 8-1, H-3, X-7',
  'Spread 9-1, H-5, Z-Reverse',
  'Trips Left 2-2-2, H-3, Z-8',
  'Trips Right 2-2-2, H-3, X-8',
]

/**
 * @typedef {Object} Play
 * @property {string} id
 * @property {string} name
 * @property {string} call
 * @property {string} formationId
 * @property {string} audioCall
 * @property {import('./playCall.js').ParsedPlayCall} parsed
 */

/**
 * @param {string[]} calls
 * @param {string} idPrefix
 * @returns {Play[]}
 */
function buildPlays(calls, idPrefix) {
  return calls.map((call, i) => {
    const parsed = parsePlayCall(call)
    return {
      id: `${idPrefix}-${i + 1}`,
      name: call,
      call,
      formationId: parsed.formationId,
      audioCall: parsed.audioCall,
      parsed,
    }
  })
}

/** @type {Play[]} */
export const plays = buildPlays(LEARN_CALLS, 'play')

/** Full Guess-the-Play candidate list (filter runnable at quiz build time). */
/** @type {Play[]} */
export const guessPlays = buildPlays(GUESS_CALLS, 'guess')

export function getPlayById(id) {
  return plays.find((p) => p.id === id) || guessPlays.find((p) => p.id === id)
}
