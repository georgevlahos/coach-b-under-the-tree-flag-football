import { routes, formatRoute } from './routes.js'
import { formations } from './formations.js'
import { plays, guessPlays } from './plays.js'
import { getQuizPositions } from './positions.js'
import { highlightCallForPosition, speakableCall, withoutTripsDashes } from './playCall.js'
import { getRunnablePlays } from '../visual/runPlay.js'

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
  { id: 'guess-the-play', label: 'Guess the Play', emoji: '👀', color: '#2a9d8f' },
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

function formationListenOptions(correct) {
  const pool = ['X and Z', 'L and R', 'Only L', 'Only R', 'Only H', 'Only X', 'Only Z', 'C and Q']
  return shuffle([correct, ...pickWrong(pool, correct, 3)])
}

function generateFormationQuestions() {
  /** @type {QuizQuestion[]} */
  const qs = []

  for (const f of formations) {
    qs.push({
      id: `form-id-${f.id}`,
      type: 'multiple-choice',
      category: 'formations',
      prompt: 'Which formation is this?',
      options: shuffle(formations.map((x) => x.name)),
      answer: f.name,
      explanation: `${f.name}: ${f.description}`,
      visual: { mode: 'formation', formationId: f.id },
    })

    qs.push({
      id: `form-listen-1st-${f.id}`,
      type: 'multiple-choice',
      category: 'formations',
      prompt: `In ${f.name}, who listens for the first route number?`,
      options: formationListenOptions('X and Z'),
      answer: 'X and Z',
      explanation: `Outside receivers X and Z take the first number unless tagged.<ul class="feedback-details"><li>${f.listenFor.replace(/\n/g, '</li><li>')}</li></ul>`,
      meta: { listenSlot: 'first', formationId: f.id },
    })

    if (f.id === 'spread') {
      qs.push({
        id: `form-listen-2nd-${f.id}`,
        type: 'multiple-choice',
        category: 'formations',
        prompt: `In ${f.name}, who listens for the second route number?`,
        options: formationListenOptions('L and R'),
        answer: 'L and R',
        explanation: `Slot receivers L and R take the second number unless tagged.<ul class="feedback-details"><li>${f.listenFor.replace(/\n/g, '</li><li>')}</li></ul>`,
        meta: { listenSlot: 'second', formationId: f.id },
      })
    } else if (f.id === 'trips-left') {
      qs.push({
        id: `form-listen-2nd-${f.id}`,
        type: 'multiple-choice',
        category: 'formations',
        prompt: `In ${f.name}, who listens for the second route number?`,
        options: formationListenOptions('Only L'),
        answer: 'Only L',
        explanation: `On Trips Left, L takes the second number unless tagged.<ul class="feedback-details"><li>${f.listenFor.replace(/\n/g, '</li><li>')}</li></ul>`,
        meta: { listenSlot: 'second', formationId: f.id },
      })
      qs.push({
        id: `form-listen-3rd-${f.id}`,
        type: 'multiple-choice',
        category: 'formations',
        prompt: `In ${f.name}, who listens for the third route number?`,
        options: formationListenOptions('Only R'),
        answer: 'Only R',
        explanation: `On Trips Left, R takes the third number unless tagged.<ul class="feedback-details"><li>${f.listenFor.replace(/\n/g, '</li><li>')}</li></ul>`,
        meta: { listenSlot: 'third', formationId: f.id },
      })
    } else if (f.id === 'trips-right') {
      qs.push({
        id: `form-listen-2nd-${f.id}`,
        type: 'multiple-choice',
        category: 'formations',
        prompt: `In ${f.name}, who listens for the second route number?`,
        options: formationListenOptions('Only R'),
        answer: 'Only R',
        explanation: `On Trips Right, R takes the second number unless tagged.<ul class="feedback-details"><li>${f.listenFor.replace(/\n/g, '</li><li>')}</li></ul>`,
        meta: { listenSlot: 'second', formationId: f.id },
      })
      qs.push({
        id: `form-listen-3rd-${f.id}`,
        type: 'multiple-choice',
        category: 'formations',
        prompt: `In ${f.name}, who listens for the third route number?`,
        options: formationListenOptions('Only L'),
        answer: 'Only L',
        explanation: `On Trips Right, L takes the third number unless tagged.<ul class="feedback-details"><li>${f.listenFor.replace(/\n/g, '</li><li>')}</li></ul>`,
        meta: { listenSlot: 'third', formationId: f.id },
      })
    }
  }

  return qs
}

/**
 * Pick formation questions with at most one "first route number" listen question per quiz.
 * @param {QuizQuestion[]} pool
 * @param {number} count
 */
function pickFormationQuestions(pool, count) {
  const shuffled = shuffle(pool)
  /** @type {QuizQuestion[]} */
  const picked = []
  let firstListenUsed = false

  for (const q of shuffled) {
    if (picked.length >= count) break
    if (q.meta?.listenSlot === 'first') {
      if (firstListenUsed) continue
      firstListenUsed = true
    }
    picked.push(q)
  }

  if (picked.length < count) {
    for (const q of shuffled) {
      if (picked.length >= count) break
      if (picked.includes(q)) continue
      if (q.meta?.listenSlot === 'first') continue
      picked.push(q)
    }
  }

  return shuffle(picked)
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

/**
 * Stable label for H's assignment (route # / play name) — used to match foils.
 * @param {import('./plays.js').Play} play
 */
function hAssignmentKey(play) {
  const a = play?.parsed?.assignments?.H
  if (!a) return ''
  return String(a.label || `${a.kind}:${a.routeNumber ?? a.playName ?? ''}`)
}

/**
 * Multiple-choice options for Guess the Play.
 * Prefer foils that share H's route/play so kids can't solve from the H tag alone.
 * Also usually same-formation distractors; occasionally one other-formation foil.
 * @param {import('./plays.js').Play} correct
 * @param {import('./plays.js').Play[]} pool
 */
function guessPlayCallOptions(correct, pool) {
  const correctH = hAssignmentKey(correct)
  const others = pool.filter((p) => p.id !== correct.id && p.call !== correct.call)

  const sameH = others.filter((p) => hAssignmentKey(p) === correctH)
  const diffH = others.filter((p) => hAssignmentKey(p) !== correctH)

  const sameHSameForm = shuffle(sameH.filter((p) => p.formationId === correct.formationId))
  const sameHOtherForm = shuffle(sameH.filter((p) => p.formationId !== correct.formationId))
  const diffHSameForm = shuffle(diffH.filter((p) => p.formationId === correct.formationId))
  const diffHOtherForm = shuffle(diffH.filter((p) => p.formationId !== correct.formationId))

  /** @type {import('./plays.js').Play[]} */
  const wrongPlays = []
  const pushUnique = (play) => {
    if (wrongPlays.length >= 3) return
    if (wrongPlays.some((p) => p.call === play.call)) return
    wrongPlays.push(play)
  }

  // Fill same-H foils first (ideally all three wrong answers match H)
  for (const play of [...sameHSameForm, ...sameHOtherForm]) pushUnique(play)

  // ~45%: if we already have room, prefer an other-formation same-H when available;
  // otherwise allow one other-formation foil among remaining slots later.
  const includeOtherForm = Math.random() < 0.45

  // Remaining slots (only if not enough same-H plays in the bank)
  const fillers = includeOtherForm
    ? [...diffHOtherForm, ...diffHSameForm]
    : [...diffHSameForm, ...diffHOtherForm]
  for (const play of fillers) pushUnique(play)

  return shuffle([correct.call, ...wrongPlays.slice(0, 3).map((p) => p.call)])
}

function guessPlayExplanation(play) {
  const lineup = ['X', 'L', 'R', 'Z', 'H']
    .map((id) => {
      const a = play.parsed.assignments[id]
      return `${id}: ${a?.label || '—'}`
    })
    .join('  ·  ')

  return (
    `The call was <strong>"${play.call}"</strong>.` +
    `<ul class="feedback-details"><li>${lineup}</li></ul>`
  )
}

function generateGuessPlayQuestions() {
  const pool = getRunnablePlays(guessPlays)
  /** @type {QuizQuestion[]} */
  const qs = []

  for (const play of pool) {
    qs.push({
      id: `guess-${play.id}`,
      type: 'multiple-choice',
      category: 'guess-the-play',
      prompt: 'Watch the play — what was the call?',
      // Options are filled fresh when the quiz starts (so formation foils reshuffle)
      options: [],
      answer: play.call,
      explanation: guessPlayExplanation(play),
      // Do not speak the call — that would give away the answer
      audioPrompt: '',
      visual: { mode: 'run-play', playId: play.id, formationId: play.formationId },
      meta: { playId: play.id, formationId: play.formationId },
    })
  }

  return qs
}

let _cache = null

export function generateAllQuestions() {
  if (_cache) return _cache
  _cache = [
    ...generateRouteQuestions(),
    ...generatePlayCallQuestions(),
    ...generateGuessPlayQuestions(),
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
  } else if (categoryId === 'guess-the-play') {
    const guessPool = getRunnablePlays(guessPlays)
    const byId = new Map(guessPool.map((p) => [p.id, p]))
    pool = all
      .filter((q) => q.category === 'guess-the-play')
      .map((q) => {
        const play = byId.get(q.meta?.playId)
        if (!play) return q
        return { ...q, options: guessPlayCallOptions(play, guessPool) }
      })
  } else if (categoryId === 'formations') {
    return pickFormationQuestions(
      all.filter((q) => q.category === 'formations'),
      count,
    )
  } else if (categoryId === 'mixed') {
    const routesQ = shuffle(all.filter((q) => q.category === 'routes'))
    const playsQ = getQuestionsForCategory('play-calls', Math.ceil(count * 0.5), opts)
    pool = shuffle([...routesQ.slice(0, Math.ceil(count * 0.5)), ...playsQ])
    return pool.slice(0, count)
  }

  return shuffle(pool).slice(0, count)
}
