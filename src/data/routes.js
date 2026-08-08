/** @typedef {Object} Route
 * @property {string} id
 * @property {string} name
 * @property {string} nickname
 * @property {string} description
 * @property {string} depth - short | medium | deep
 * @property {string} tip
 * @property {Array<{ x: number, y: number }>} path - SVG path points from line of scrimmage
 */

/** @type {Route[]} */
export const routes = [
  {
    id: 'flat',
    name: 'Flat',
    nickname: 'The Check-Down',
    description: 'Run straight toward the sideline at about 3–5 yards depth.',
    depth: 'short',
    tip: 'Great safety valve — if nothing else is open, hit the flat!',
    path: [
      { x: 50, y: 68 },
      { x: 35, y: 68 },
      { x: 20, y: 65 },
    ],
  },
  {
    id: 'slant',
    name: 'Slant',
    nickname: 'The Quick Strike',
    description: 'Take 3 steps forward, then cut sharply inside at a 45° angle.',
    depth: 'short',
    tip: 'Timing route — QB throws before you cut!',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 62 },
      { x: 42, y: 55 },
    ],
  },
  {
    id: 'out',
    name: 'Out',
    nickname: 'The Sideline',
    description: 'Run straight downfield, then break sharply toward the sideline at 5–10 yards.',
    depth: 'medium',
    tip: 'Plant your outside foot hard when you cut — sell the go route first!',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 55 },
      { x: 35, y: 55 },
    ],
  },
  {
    id: 'in',
    name: 'In (Dig)',
    nickname: 'The Crosser',
    description: 'Run straight, then cut sharply toward the middle of the field.',
    depth: 'medium',
    tip: 'Also called a "dig" — find the soft spot between defenders.',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 55 },
      { x: 65, y: 55 },
    ],
  },
  {
    id: 'curl',
    name: 'Curl (Hook)',
    nickname: 'The Comeback',
    description: 'Run downfield, stop, and turn back toward the QB.',
    depth: 'medium',
    tip: 'Sit in the hole in the zone — QB will find you!',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 50 },
      { x: 50, y: 52 },
    ],
  },
  {
    id: 'go',
    name: 'Go (Streak / Fly)',
    nickname: 'The Burner',
    description: 'Run straight downfield as fast as you can — deep route!',
    depth: 'deep',
    tip: 'Stack the defender — run right past them!',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 45 },
      { x: 50, y: 25 },
    ],
  },
  {
    id: 'post',
    name: 'Post',
    nickname: 'The Deep Middle',
    description: 'Run deep, then break at 45° toward the goalpost (middle of field).',
    depth: 'deep',
    tip: 'Named because you break toward the goal post!',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 45 },
      { x: 55, y: 25 },
    ],
  },
  {
    id: 'corner',
    name: 'Corner',
    nickname: 'The Flag',
    description: 'Run deep, then break at 45° toward the corner of the end zone.',
    depth: 'deep',
    tip: 'One of the toughest routes to cover — stretch the field!',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 45 },
      { x: 35, y: 25 },
    ],
  },
  {
    id: 'wheel',
    name: 'Wheel',
    nickname: 'The Curve',
    description: 'Start with a flat route, then turn upfield along the sideline.',
    depth: 'deep',
    tip: 'Looks like a flat at first — then you turn and go deep!',
    path: [
      { x: 50, y: 68 },
      { x: 30, y: 65 },
      { x: 25, y: 45 },
      { x: 25, y: 25 },
    ],
  },
  {
    id: 'seam',
    name: 'Seam',
    nickname: 'The Alley',
    description: 'Run straight down the seam between two defenders.',
    depth: 'deep',
    tip: 'Find the gap between the safety and linebacker!',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 50 },
      { x: 50, y: 30 },
    ],
  },
]

export function getRouteById(id) {
  return routes.find((r) => r.id === id)
}
