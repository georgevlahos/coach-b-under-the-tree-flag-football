/** @typedef {Object} Formation
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} whenToUse
 * @property {string} listenFor
 * @property {Record<string, { x: number, y: number }>} spots
 */

/** @type {Formation[]} */
export const formations = [
  {
    id: 'spread',
    name: 'Spread',
    description: 'Receivers spread evenly — two left (X, L), two right (R, Z). H is offset in the backfield.',
    whenToUse: 'Default look. Outside run the first number; slots run the second (mirrored).',
    listenFor: 'X & Z listen for 1st Number\nL & R listen for 2nd number\nH listen for tag',
    spots: {
      X: { x: 12, y: 68 },
      L: { x: 30, y: 68 },
      C: { x: 50, y: 68 },
      R: { x: 70, y: 68 },
      Z: { x: 88, y: 68 },
      H: { x: 56, y: 76 },
      Q: { x: 50, y: 84 },
    },
  },
  {
    id: 'trips-left',
    name: 'Trips Left',
    description: 'Three receivers bunched on the left (X, L, R). Z alone on the far right.',
    whenToUse: 'Flood the left. Digits go outside → L → R.',
    listenFor: 'X & Z listen for 1st Number\nL listen for 2nd number\nR listen for 3rd number\nH listen for tag',
    spots: {
      X: { x: 10, y: 68 },
      L: { x: 20, y: 68 },
      R: { x: 30, y: 68 },
      C: { x: 50, y: 68 },
      Z: { x: 88, y: 68 },
      H: { x: 44, y: 76 },
      Q: { x: 50, y: 84 },
    },
  },
  {
    id: 'trips-right',
    name: 'Trips Right',
    description: 'X alone on the far left. Three receivers bunched on the right (L, R, Z).',
    whenToUse: 'Flood the right. Digits go outside → R → L.',
    listenFor: 'X & Z listen for 1st Number\nR listen for 2nd number\nL listen for 3rd number\nH listen for tag',
    spots: {
      X: { x: 12, y: 68 },
      C: { x: 50, y: 68 },
      L: { x: 70, y: 68 },
      R: { x: 80, y: 68 },
      Z: { x: 90, y: 68 },
      H: { x: 56, y: 76 },
      Q: { x: 50, y: 84 },
    },
  },
]

export function getFormationById(id) {
  return formations.find((f) => f.id === id)
}
