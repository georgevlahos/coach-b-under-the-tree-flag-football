/** @typedef {Object} Formation
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} whenToUse
 * @property {Record<string, { x: number, y: number }>} spots - position id -> field coords
 */

/** @type {Formation[]} */
export const formations = [
  {
    id: 'spread',
    name: 'Spread',
    description: 'Receivers spread wide across the field. QB in shotgun (a few steps back).',
    whenToUse: 'Great for passing — opens up the field and spreads out defenders.',
    spots: {
      qb: { x: 50, y: 78 },
      center: { x: 50, y: 68 },
      'wr-x': { x: 10, y: 68 },
      'wr-z': { x: 90, y: 68 },
      slot: { x: 65, y: 68 },
      rb: { x: 55, y: 82 },
    },
  },
  {
    id: 'trips',
    name: 'Trips (3 Right)',
    description: 'Three receivers stacked on one side of the field.',
    whenToUse: 'Overloads one side — forces the defense to shift and creates mismatches.',
    spots: {
      qb: { x: 50, y: 78 },
      center: { x: 50, y: 68 },
      'wr-x': { x: 12, y: 68 },
      slot: { x: 72, y: 68 },
      'wr-z': { x: 88, y: 68 },
      te: { x: 58, y: 68 },
      rb: { x: 42, y: 82 },
    },
  },
  {
    id: 'doubles',
    name: 'Doubles (2x2)',
    description: 'Two receivers on each side of the field — balanced look.',
    whenToUse: 'Keeps the defense honest — they can\'t cheat to one side.',
    spots: {
      qb: { x: 50, y: 78 },
      center: { x: 50, y: 68 },
      'wr-x': { x: 12, y: 68 },
      te: { x: 30, y: 68 },
      slot: { x: 70, y: 68 },
      'wr-z': { x: 88, y: 68 },
      rb: { x: 50, y: 85 },
    },
  },
  {
    id: 'i-form',
    name: 'I-Formation',
    description: 'RB lines up directly behind the QB. Power running look.',
    whenToUse: 'Classic formation — can run or pass. Keeps defense guessing.',
    spots: {
      qb: { x: 50, y: 72 },
      center: { x: 50, y: 68 },
      rb: { x: 50, y: 85 },
      'wr-x': { x: 12, y: 68 },
      'wr-z': { x: 88, y: 68 },
    },
  },
  {
    id: 'empty',
    name: 'Empty Backfield',
    description: 'No running back in the backfield — all receivers spread out.',
    whenToUse: 'Maximum passing options. QB has to get rid of the ball fast!',
    spots: {
      qb: { x: 50, y: 78 },
      center: { x: 50, y: 68 },
      'wr-x': { x: 8, y: 68 },
      te: { x: 28, y: 68 },
      slot: { x: 50, y: 68 },
      'wr-z': { x: 72, y: 68 },
      rb: { x: 92, y: 68 },
    },
  },
  {
    id: 'bunch',
    name: 'Bunch',
    description: 'Three receivers grouped close together on one side.',
    whenToUse: 'Creates pick/rub routes and confusion for defenders.',
    spots: {
      qb: { x: 50, y: 78 },
      center: { x: 50, y: 68 },
      'wr-x': { x: 15, y: 68 },
      slot: { x: 78, y: 68 },
      'wr-z': { x: 85, y: 72 },
      te: { x: 72, y: 68 },
      rb: { x: 40, y: 82 },
    },
  },
]

export function getFormationById(id) {
  return formations.find((f) => f.id === id)
}
