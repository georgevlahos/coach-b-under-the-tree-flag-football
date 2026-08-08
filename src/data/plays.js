/** @typedef {Object} PlayAssignment
 * @property {string} positionId
 * @property {string} routeId
 * @property {string} [note]
 */

/** @typedef {Object} Play
 * @property {string} id
 * @property {string} name
 * @property {string} formationId
 * @property {string} description
 * @property {string} concept
 * @property {PlayAssignment[]} assignments
 * @property {string} qbRead - what the QB should look for
 * @property {string} audioCall - how Coach B would call it
 */

/** @type {Play[]} */
export const plays = [
  {
    id: 'slant-flat',
    name: 'Slant-Flat',
    formationId: 'spread',
    description: 'A quick, high-percentage pass play — perfect for beginners!',
    concept: 'High-low read on one side: slant goes inside, flat goes outside.',
    assignments: [
      { positionId: 'slot', routeId: 'slant', note: 'Primary read — quick throw!' },
      { positionId: 'rb', routeId: 'flat', note: 'Check-down if slant is covered' },
      { positionId: 'wr-x', routeId: 'go', note: 'Clear out the corner' },
      { positionId: 'wr-z', routeId: 'curl' },
    ],
    qbRead: '1. Slant (slot)  2. Flat (RB)  3. Curl (Z)',
    audioCall: 'Spread right, Slant-Flat on two!',
  },
  {
    id: 'flood-right',
    name: 'Flood Right',
    formationId: 'trips',
    description: 'Three receivers run routes to the same side — flood the zone!',
    concept: 'Overload one side with routes at different depths.',
    assignments: [
      { positionId: 'wr-z', routeId: 'go', note: 'Deep — stretch the defense' },
      { positionId: 'slot', routeId: 'out', note: 'Intermediate' },
      { positionId: 'te', routeId: 'flat', note: 'Short — easy completion' },
      { positionId: 'wr-x', routeId: 'go', note: 'Clear out the back side' },
    ],
    qbRead: '1. Flat (TE)  2. Out (slot)  3. Go (Z)',
    audioCall: 'Trips right, Flood on one!',
  },
  {
    id: 'four-verticals',
    name: 'Four Verticals',
    formationId: 'doubles',
    description: 'Four receivers run straight downfield — attack deep!',
    concept: 'Stretch the defense vertically and find the open seam.',
    assignments: [
      { positionId: 'wr-x', routeId: 'go' },
      { positionId: 'te', routeId: 'seam', note: 'Run the seam between defenders' },
      { positionId: 'slot', routeId: 'go' },
      { positionId: 'wr-z', routeId: 'go' },
      { positionId: 'rb', routeId: 'flat', note: 'Check-down safety valve' },
    ],
    qbRead: 'Find the open seam — usually between two deep defenders.',
    audioCall: 'Doubles, Four Verts, on three!',
  },
  {
    id: 'mesh',
    name: 'Mesh',
    formationId: 'bunch',
    description: 'Two receivers cross paths at shallow depth — pick city!',
    concept: 'Crossing routes create natural picks and confusion.',
    assignments: [
      { positionId: 'slot', routeId: 'in', note: 'Cross left to right' },
      { positionId: 'wr-z', routeId: 'in', note: 'Cross right to left' },
      { positionId: 'te', routeId: 'out', note: 'Sit over the mesh' },
      { positionId: 'wr-x', routeId: 'go', note: 'Clear out' },
    ],
    qbRead: '1. First crosser  2. Second crosser  3. Sit route (TE)',
    audioCall: 'Bunch left, Mesh on two!',
  },
  {
    id: 'smash',
    name: 'Smash',
    formationId: 'spread',
    description: 'Corner route plus a hitch/curl underneath — classic combo!',
    concept: 'High-low on the outside: corner deep, hitch short.',
    assignments: [
      { positionId: 'wr-z', routeId: 'corner', note: 'Deep corner — stretch' },
      { positionId: 'slot', routeId: 'curl', note: 'Short hitch underneath' },
      { positionId: 'wr-x', routeId: 'go' },
      { positionId: 'rb', routeId: 'flat' },
    ],
    qbRead: '1. Hitch (slot)  2. Corner (Z) if hitch is covered',
    audioCall: 'Spread left, Smash on one!',
  },
  {
    id: 'stick',
    name: 'Stick',
    formationId: 'trips',
    description: 'Simple stick/sit route with a flat — great for 3rd and short!',
    concept: 'Stick route holds the zone, flat runs underneath.',
    assignments: [
      { positionId: 'te', routeId: 'in', note: 'Stick route — sit at 5 yards' },
      { positionId: 'rb', routeId: 'flat' },
      { positionId: 'wr-z', routeId: 'go' },
      { positionId: 'slot', routeId: 'out' },
    ],
    qbRead: '1. Stick (TE)  2. Flat (RB)',
    audioCall: 'Trips right, Stick on two!',
  },
]

export function getPlayById(id) {
  return plays.find((p) => p.id === id)
}
