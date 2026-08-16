import { routes, formatRoute } from './routes.js'
import { formations } from './formations.js'
import { plays } from './plays.js'
import { getQuizPositions } from './positions.js'
import { highlightCallForPosition, speakableCall, withoutTripsDashes } from './playCall.js'

/**
 * @typedef {Object} QuizQuestion
 * @property {string} id
 * @property {string} type
 * @property {string} category
 * @property {string} prompt
 * @property {string} [hint]
 * @property {string[]} [options]
 * @property {string | boolean} answer
 * @property {string} explanation
 * @property {string} [audioPrompt]
 * @property {Object} [visual]
 */

export const CATEGORIES = [
  { id: 'routes', label: 'Test Me on Routes', emoji: '🏃', color: '#eb6d20' },
  { id: 'play-calls', label: 'Test Me on Play Calls', emoji: '📢', color: '#0d1167' },
  { id: 'formations', label: 'Formations', emoji: '📐', color: '#3d5a80' },
]

/** @param {import('./routes.js').Route} route @param {string} [headline] */
function routeExplanation(route, headline) {
  const title = headline || `<strong>${formatRoute(route)}</strong>`
  return `Correct answer is:<br>${title}<ul class="feedback-details"><li>${route.description}</li></ul>`
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickWrong(pool, correct, n = 3) {
  return shuffle(pool.filter((x) => x !== correct)).slice(0, n)
}

function routeNumberOptions(correctNum) {
  const nums = routes.map((r) => String(r.number))
  return shuffle([String(correctNum), ...pickWrong(nums, String(correctNum), 3)])
}

function routeNameOptions(correctName) {
  const names = routes.map((r) => r.name)
  return shuffle([correctName, ...pickWrong(names, correctName, 3)])
}

function generateRouteQuestions() {
  /** @type {QuizQuestion[]} */
  const qs = []

  for (const route of routes) {
    qs.push({
      id: `route-img-num-${route.id}`,
      type: 'multiple-choice',
      category: 'routes',
      prompt: 'What route number is this?',
      options: routeNumberOptions(route.number),
      answer: String(route.number),
      explanation: routeExplanation(route),
      visual: { mode: 'route-field', routeId: route.id },
    })

    qs.push({
      id: `route-img-name-${route.id}`,
      type: 'multiple-choice',
      category: 'routes',
      prompt: 'What route name is this?',
      options: routeNameOptions(route.name),
      answer: route.name,
      explanation: routeExplanation(route),
      visual: { mode: 'route-field', routeId: route.id },
    })

    qs.push({
      id: `route-num-to-name-${route.id}`,
      type: 'multiple-choice',
      category: 'routes',
      prompt: `Route number ${route.number} is called…`,
      options: routeNameOptions(route.name),
      answer: route.name,
      explanation: routeExplanation(route),
      audioPrompt: `Route number ${route.number} is called what?`,
    })

    qs.push({
      id: `route-name-to-num-${route.id}`,
      type: 'multiple-choice',
      category: 'routes',
      prompt: `What number is the ${route.name} route?`,
      options: routeNumberOptions(route.number),
      answer: String(route.number),
      explanation: routeExplanation(route, `<strong>${formatRoute(route)}</strong>`),
      audioPrompt: `What number is the ${route.name} route?`,
    })
  }

  return qs
}

function generateFormationQuestions() {
  return formations.flatMap((f) => [
    {
      id: `form-id-${f.id}`,
      type: 'multiple-choice',
      category: 'formations',
      prompt: 'Which formation is this?',
      options: shuffle(formations.map((x) => x.name)),
      answer: f.name,
      explanation: `${f.name}: ${f.description}`,
      visual: { mode: 'formation', formationId: f.id },
    },
    {
      id: `form-listen-${f.id}`,
      type: 'multiple-choice',
      category: 'formations',
      prompt: `In ${f.name}, who listens for the first route number?`,
      options: shuffle(['X and Z', 'L and R', 'Only H', 'C and Q']),
      answer: 'X and Z',
      explanation: `Outside receivers X and Z take the first number unless tagged. (${f.listenFor})`,
    },
  ])
}

function answerChoicesFor(assignment, parsed) {
  const correct = assignment.label
  const pool = new Set([correct])

  for (const a of Object.values(parsed.assignments)) {
    if (a?.label) pool.add(a.label)
  }
  for (const r of shuffle(routes).slice(0, 4)) {
    pool.add(formatRoute(r))
  }
  pool.add('Reverse')
  pool.add('Fake Reverse')
  pool.add('motion left + 3 - Arrow')
  pool.add('fake run left')

  const wrong = shuffle([...pool].filter((x) => x !== correct)).slice(0, 3)
  return shuffle([correct, ...wrong])
}

function playCallExplanation(pos, play, assignment) {
  const lineup = ['X', 'L', 'R', 'Z', 'H']
    .map((id) => {
      const a = play.parsed.assignments[id]
      const mark = id === pos.id ? '✓ ' : ''
      return `${mark}${id}: ${a?.label || '—'}`
    })
    .join('  ·  ')

  const callHtml = highlightCallForPosition(play.call, pos.id, play.formationId)

  return (
    `For <strong>${pos.shortName}</strong> on "${callHtml}":  ` +
    `<strong>${assignment.label}</strong>` +
    `<ul class="feedback-details"><li>${lineup}</li></ul>`
  )
}

function generatePlayCallQuestions() {
  /** @type {QuizQuestion[]} */
  const qs = []

  plays.forEach((play, playIndex) => {
    // Quiz variety: half of Trips calls shown without dashes (193); teaching uses dashes
    const isTrips = String(play.formationId || '').startsWith('trips')
    const displayCall =
      isTrips && playIndex % 2 === 0 ? withoutTripsDashes(play.call) : play.call
    const displayPlay = { ...play, call: displayCall }

    for (const pos of getQuizPositions()) {
      const assignment = play.parsed.assignments[pos.id]
      if (!assignment) continue

      qs.push({
        id: `pc-${play.id}-${pos.id}`,
        type: 'multiple-choice',
        category: 'play-calls',
        prompt: `What do you do on this play call?<br><span class="play-call-cue">"${displayCall}"</span>`,
        options: answerChoicesFor(assignment, play.parsed),
        answer: assignment.label,
        explanation: playCallExplanation(pos, displayPlay, assignment),
        audioPrompt: speakableCall(displayCall),
        visual: { mode: 'formation', formationId: play.formationId, highlightId: pos.id },
        meta: {
          playId: play.id,
          positionId: pos.id,
          routeNumber: assignment.routeNumber,
        },
      })
    }
  })

  return qs
}

let _cache = null

export function generateAllQuestions() {
  if (_cache) return _cache
  _cache = [
    ...generateRouteQuestions(),
    ...generatePlayCallQuestions(),
    ...generateFormationQuestions(),
  ]
  return _cache
}

/**
 * @param {string} categoryId
 * @param {number} count
 * @param {{ positionId?: string }} [opts]
 */
export function getQuestionsForCategory(categoryId, count, opts = {}) {
  const all = generateAllQuestions()
  let pool = all

  if (categoryId === 'routes') {
    pool = all.filter((q) => q.category === 'routes')
  } else if (categoryId === 'play-calls') {
    const positionId = opts.positionId || 'X'
    pool = all.filter(
      (q) => q.category === 'play-calls' && q.meta?.positionId === positionId,
    )
    return shuffle(pool).slice(0, count)
  } else if (categoryId === 'formations') {
    pool = all.filter((q) => q.category === 'formations')
  } else if (categoryId === 'mixed') {
    const routesQ = shuffle(all.filter((q) => q.category === 'routes'))
    const playsQ = getQuestionsForCategory('play-calls', Math.ceil(count * 0.5), opts)
    pool = shuffle([...routesQ.slice(0, Math.ceil(count * 0.5)), ...playsQ])
    return pool.slice(0, count)
  }

  return shuffle(pool).slice(0, count)
}
