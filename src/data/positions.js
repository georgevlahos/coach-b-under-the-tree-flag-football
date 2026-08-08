/** @typedef {'multiple-choice' | 'true-false' | 'match' | 'identify' | 'sequence'} QuizType */

/**
 * @typedef {Object} QuizQuestion
 * @property {string} id
 * @property {QuizType} type
 * @property {string} category - positions | formations | routes | plays
 * @property {string} prompt
 * @property {string} [hint]
 * @property {string[]} [options]
 * @property {string | string[] | boolean} answer
 * @property {string} explanation
 * @property {string} [audioPrompt] - spoken version for future audio mode
 * @property {Object} [visual] - field diagram data for visual mode
 */

/** @type {import('./positions.js').Position[]} */
export const positions = [
  {
    id: 'qb',
    name: 'Quarterback (QB)',
    shortName: 'QB',
    emoji: '🎯',
    description: 'The leader on offense. Gets the snap and throws or hands off the ball.',
    job: 'Read the defense, call the play, and get the ball to a teammate.',
    tip: 'Keep your eyes up! Scan the field before you throw.',
    fieldSpot: { x: 50, y: 75 },
  },
  {
    id: 'center',
    name: 'Center (C)',
    shortName: 'C',
    emoji: '⚡',
    description: 'Snaps the ball to the QB to start every play.',
    job: 'Snap the ball cleanly, then block or run a route.',
    tip: 'Snap first, then move — a bad snap ruins the whole play!',
    fieldSpot: { x: 50, y: 68 },
  },
  {
    id: 'rb',
    name: 'Running Back (RB)',
    shortName: 'RB',
    emoji: '🏃‍♀️',
    description: 'Lines up behind or beside the QB. Can run with the ball or catch passes.',
    job: 'Run routes, take handoffs, and protect the QB if needed.',
    tip: 'Know your assignment — are you running or catching?',
    fieldSpot: { x: 50, y: 82 },
  },
  {
    id: 'wr-x',
    name: 'Wide Receiver — X (WR)',
    shortName: 'X',
    emoji: '⭐',
    description: 'Lines up on the line of scrimmage, usually on the weak side (fewer teammates on that side).',
    job: 'Run crisp routes and catch passes.',
    tip: 'The X receiver is often the go-to target on quick throws.',
    fieldSpot: { x: 15, y: 68 },
  },
  {
    id: 'wr-z',
    name: 'Wide Receiver — Z (WR)',
    shortName: 'Z',
    emoji: '💫',
    description: 'Lines up off the line (a step back) so another receiver can be on the line.',
    job: 'Run routes — often the deep threat or motion player.',
    tip: 'Being off the line lets the offense use more formations legally.',
    fieldSpot: { x: 85, y: 68 },
  },
  {
    id: 'slot',
    name: 'Slot Receiver',
    shortName: 'SL',
    emoji: '✨',
    description: 'Lines up between the tackle and the outside receiver — in the "slot."',
    job: 'Run short and medium routes; great for quick passes.',
    tip: 'The slot is a sweet spot — hard for defenders to cover!',
    fieldSpot: { x: 70, y: 68 },
  },
  {
    id: 'te',
    name: 'Tight End (TE)',
    shortName: 'TE',
    emoji: '💪',
    description: 'A hybrid — lines up on the line like a lineman but catches like a receiver.',
    job: 'Block, run short routes, and be a safety valve for the QB.',
    tip: 'TEs are matchup nightmares — too fast for linebackers, too big for corners!',
    fieldSpot: { x: 35, y: 68 },
  },
]

export function getPositionById(id) {
  return positions.find((p) => p.id === id)
}
