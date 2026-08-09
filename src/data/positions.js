/** @typedef {Object} Position
 * @property {string} id
 * @property {string} name
 * @property {string} shortName
 * @property {string} emoji
 * @property {string} description
 * @property {string} job
 * @property {string} tip
 * @property {{ x: number, y: number }} fieldSpot
 * @property {boolean} [quizEligible]
 */

/** @type {Position[]} */
export const positions = [
  {
    id: 'X',
    name: 'Outside Receiver (Left)',
    shortName: 'X',
    emoji: '⭐',
    description: 'Far-left outside receiver.',
    job: 'Run your route every play and catch when the ball comes to you.',
    tip: 'You take the first number in the play call unless tagged.',
    fieldSpot: { x: 12, y: 68 },
    quizEligible: true,
  },
  {
    id: 'L',
    name: 'Slot Receiver (Left)',
    shortName: 'L',
    emoji: '⚡',
    description: 'Left slot — second from the left in Spread.',
    job: 'Run crisp short and medium routes from the slot.',
    tip: 'In Trips Right you are the innermost receiver on the right bunch.',
    fieldSpot: { x: 30, y: 68 },
    quizEligible: true,
  },
  {
    id: 'R',
    name: 'Slot Receiver (Right)',
    shortName: 'R',
    emoji: '💫',
    description: 'Right slot — second from the right in Spread.',
    job: 'Mirror the left slot and run your number from the call.',
    tip: 'In Trips Left you are the innermost receiver on the left bunch.',
    fieldSpot: { x: 70, y: 68 },
    quizEligible: true,
  },
  {
    id: 'Z',
    name: 'Outside Receiver (Right)',
    shortName: 'Z',
    emoji: '🌟',
    description: 'Far-right outside receiver.',
    job: 'Run your route every play — often mirrored with X.',
    tip: 'You take the first number in the play call unless tagged.',
    fieldSpot: { x: 88, y: 68 },
    quizEligible: true,
  },
  {
    id: 'H',
    name: 'Halfback',
    shortName: 'H',
    emoji: '🏃',
    description: 'Backfield player behind the center — always tagged in the call.',
    job: 'Listen for your tag: route, motion, or a play like fake run.',
    tip: 'Hazer Left/Right means you go in motion, then run the route number.',
    fieldSpot: { x: 56, y: 76 },
    quizEligible: true,
  },
  {
    id: 'C',
    name: 'Center',
    shortName: 'C',
    emoji: '🎯',
    description: 'Snaps the ball to start every play.',
    job: 'Snap cleanly, then block or release as coached.',
    tip: 'Learn later — not quizzed on play calls for now.',
    fieldSpot: { x: 50, y: 68 },
    quizEligible: false,
  },
  {
    id: 'Q',
    name: 'Quarterback',
    shortName: 'Q',
    emoji: '🏈',
    description: 'Gets the snap and runs the offense.',
    job: 'Call the play, read the defense, deliver the ball.',
    tip: 'Learn later — not quizzed on play calls for now.',
    fieldSpot: { x: 50, y: 84 },
    quizEligible: false,
  },
]

export function getPositionById(id) {
  return positions.find((p) => p.id === id)
}

export function getQuizPositions() {
  return positions.filter((p) => p.quizEligible)
}
