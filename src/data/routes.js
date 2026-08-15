/** @typedef {Object} Route
 * @property {string} id - route number as string ("0"–"9")
 * @property {number} number
 * @property {string} name
 * @property {string} depth - short | medium | deep
 * @property {number} [depthYards] - override stem depth in yards
 * @property {number} [lateralYards] - override break distance in yards
 * @property {string} description
 * @property {string} image - public path to diagram
 * @property {Array<{ x: number, y: number }>} path
 */

/** @type {Route[]} */
export const routes = [
  {
    id: '1',
    number: 1,
    name: 'Hitch',
    depth: 'short',
    description: 'Run 5 yards and turn to the QB.',
    image: '/routes/route-1-hitch.jpeg',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 58 },
      { x: 50, y: 60 },
    ],
  },
  {
    id: '2',
    number: 2,
    name: 'Slant',
    depth: 'short',
    description: '3 steps, then cut toward the middle of the field.',
    image: '/routes/route-2-slant.jpeg',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 62 },
      { x: 42, y: 55 },
    ],
  },
  {
    id: '3',
    number: 3,
    name: 'Arrow',
    depth: 'short',
    description: 'Release toward the sideline.',
    image: '/routes/route-3-arrow.jpeg',
    path: [
      { x: 50, y: 68 },
      { x: 32, y: 66 },
    ],
  },
  {
    id: '4',
    number: 4,
    name: 'In',
    depth: 'short',
    depthYards: 5.5,
    lateralYards: 7,
    description: 'About 5–6 yards up, then break toward the middle.',
    image: '/routes/route-4-in.jpeg',
    // Sharp right-angle: stem up, then in (mirrored L/R; clipped so sides never meet)
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 55 },
      { x: 65, y: 55 },
    ],
  },
  {
    id: '5',
    number: 5,
    name: 'Out',
    depth: 'medium',
    description: '5 yards up, then break toward the sideline.',
    image: '/routes/route-5-out.jpeg',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 55 },
      { x: 32, y: 55 },
    ],
  },
  {
    id: '6',
    number: 6,
    name: 'Curl',
    depth: 'medium',
    description: '10 yards up, then curl back toward the QB.',
    image: '/routes/route-6-curl.jpeg',
    // Stem upfield, then inward hook that turns back toward the QB (mirrored L/R)
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 54 },
      { x: 50, y: 42 },
      { x: 50, y: 36 },
      { x: 54, y: 33 },
      { x: 60, y: 34 },
      { x: 63, y: 39 },
      { x: 61, y: 46 },
    ],
  },
  {
    id: '7',
    number: 7,
    name: 'Wheel',
    depth: 'deep',
    description: 'Run an Arrow, then turn deep down the sideline.',
    image: '/routes/route-7-wheel.jpeg',
    path: [
      { x: 50, y: 68 },
      { x: 30, y: 66 },
      { x: 28, y: 40 },
      { x: 28, y: 28 },
    ],
  },
  {
    id: '8',
    number: 8,
    name: 'Post',
    depth: 'deep',
    description: '5 yards up, then deep toward the middle.',
    image: '/routes/route-8-post.jpeg',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 50 },
      { x: 58, y: 28 },
    ],
  },
  {
    id: '9',
    number: 9,
    name: 'Corner',
    depth: 'deep',
    description: '5 yards up, then deep toward the corner.',
    image: '/routes/route-9-corner.jpeg',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 50 },
      { x: 35, y: 28 },
    ],
  },
  {
    id: '0',
    number: 0,
    name: 'Vertical',
    depth: 'deep',
    description: 'Deep route — run straight downfield.',
    image: '/routes/route-0-vertical.jpeg',
    path: [
      { x: 50, y: 68 },
      { x: 50, y: 45 },
      { x: 50, y: 25 },
    ],
  },
]

export function getRouteById(id) {
  return routes.find((r) => r.id === String(id) || r.number === Number(id))
}

export function getRouteByNumber(n) {
  return routes.find((r) => r.number === Number(n))
}

export function formatRoute(routeOrNumber) {
  const route = typeof routeOrNumber === 'object' ? routeOrNumber : getRouteByNumber(routeOrNumber)
  if (!route) return String(routeOrNumber)
  return `${route.number} - ${route.name}`
}
