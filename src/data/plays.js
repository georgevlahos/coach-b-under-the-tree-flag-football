import { parsePlayCall } from './playCall.js'

/** Example play calls from docs/BASICS.md */
const CALLS = [
  'Spread 0-1, H-0',
  'Spread 2-3, H-9',
  'Spread 2-7, H-0, Z-8',
  'Spread 9-0, H-3, L-8',
  'Spread 2-3, H-8, R-0',
  'Spread 8-1, H-3, X-7',
  'Trips Right 193 Hazer Left-3, X-2',
  'Trips Right 222, H-3, X-8',
  'Trips Right 911, Hazer Right-3, L-Reverse',
  'Trips Right 910, Xavier Right-3, H-fake run left',
  'Trips Left 193 Hazer Right-3, Z-2',
  'Trips Left 222, H-3, Z-8',
  'Trips Left 911, Hazer Right-3, R-Fake Reverse',
  'Trips Left 910, Zazer Left-3, H-fake run right',
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

/** @type {Play[]} */
export const plays = CALLS.map((call, i) => {
  const parsed = parsePlayCall(call)
  return {
    id: `play-${i + 1}`,
    name: call,
    call,
    formationId: parsed.formationId,
    audioCall: parsed.audioCall,
    parsed,
  }
})

export function getPlayById(id) {
  return plays.find((p) => p.id === id)
}
