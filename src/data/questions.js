import { positions } from './positions.js'
import { formations } from './formations.js'
import { routes } from './routes.js'
import { plays } from './plays.js'
import { getFormationById } from './formations.js'
import { getPositionById } from './positions.js'
import { getRouteById } from './routes.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickWrong(options, correct, count = 3) {
  return shuffle(options.filter((o) => o !== correct)).slice(0, count)
}

/** Generate all quiz questions from content data */
export function generateAllQuestions() {
  const questions = []

  // --- POSITIONS ---
  positions.forEach((pos) => {
    questions.push({
      id: `pos-mc-${pos.id}`,
      type: 'multiple-choice',
      category: 'positions',
      prompt: `What is the main job of the ${pos.shortName}?`,
      hint: pos.description,
      options: shuffle([
        pos.job,
        ...pickWrong(positions.map((p) => p.job), pos.job),
      ]),
      answer: pos.job,
      explanation: `${pos.name}: ${pos.description} ${pos.tip}`,
      audioPrompt: `What is the main job of the ${pos.name}?`,
    })

    questions.push({
      id: `pos-id-${pos.id}`,
      type: 'identify',
      category: 'positions',
      prompt: `Tap the ${pos.name} on the field!`,
      answer: pos.id,
      explanation: `That's the ${pos.name}! ${pos.tip}`,
      audioPrompt: `Find the ${pos.name} on the field.`,
      visual: { mode: 'position' },
    })
  })

  questions.push({
    id: 'pos-tf-qb-leader',
    type: 'true-false',
    category: 'positions',
    prompt: 'The Quarterback is the leader of the offense and calls the plays.',
    answer: true,
    explanation: 'Correct! The QB reads the defense, calls the play, and distributes the ball.',
    audioPrompt: 'True or false: The Quarterback is the leader of the offense.',
  })

  questions.push({
    id: 'pos-tf-center-snap',
    type: 'true-false',
    category: 'positions',
    prompt: 'The Center is the only player who can snap the ball to start a play.',
    answer: false,
    explanation: 'In flag football, any player can snap — but the Center usually does it!',
    audioPrompt: 'True or false: Only the Center can snap the ball.',
  })

  // --- FORMATIONS ---
  formations.forEach((form) => {
    questions.push({
      id: `form-mc-${form.id}`,
      type: 'multiple-choice',
      category: 'formations',
      prompt: `When would you use the ${form.name} formation?`,
      options: shuffle([
        form.whenToUse,
        ...pickWrong(formations.map((f) => f.whenToUse), form.whenToUse),
      ]),
      answer: form.whenToUse,
      explanation: `${form.name}: ${form.description}`,
      audioPrompt: `When would you use the ${form.name} formation?`,
    })

    questions.push({
      id: `form-id-${form.id}`,
      type: 'multiple-choice',
      category: 'formations',
      prompt: `Which formation is shown on the field?`,
      options: shuffle(formations.map((f) => f.name)),
      answer: form.name,
      explanation: `This is ${form.name}! ${form.description}`,
      audioPrompt: 'Look at the formation on the field. What is it called?',
      visual: { formationId: form.id, mode: 'formation' },
    })
  })

  questions.push({
    id: 'form-tf-spread-passing',
    type: 'true-false',
    category: 'formations',
    prompt: 'The Spread formation spreads receivers wide to open up passing lanes.',
    answer: true,
    explanation: 'Yes! Spreading out forces defenders to cover more ground.',
    audioPrompt: 'True or false: Spread formation helps passing.',
  })

  questions.push({
    id: 'form-tf-trips-overload',
    type: 'true-false',
    category: 'formations',
    prompt: 'Trips formation puts three receivers on the same side to overload the defense.',
    answer: true,
    explanation: 'Trips stacks three receivers on one side — a lot for defenders to handle!',
    audioPrompt: 'True or false: Trips puts three receivers on one side.',
  })

  // --- ROUTES ---
  routes.forEach((route) => {
    questions.push({
      id: `route-mc-${route.id}`,
      type: 'multiple-choice',
      category: 'routes',
      prompt: `Describe the ${route.name} route:`,
      options: shuffle([
        route.description,
        ...pickWrong(routes.map((r) => r.description), route.description),
      ]),
      answer: route.description,
      explanation: `${route.name} (${route.nickname}): ${route.tip}`,
      audioPrompt: `Describe the ${route.name} route.`,
      visual: { routeId: route.id, mode: 'route' },
    })

    questions.push({
      id: `route-depth-${route.id}`,
      type: 'multiple-choice',
      category: 'routes',
      prompt: `Is the ${route.name} route short, medium, or deep?`,
      options: shuffle(['short', 'medium', 'deep']),
      answer: route.depth,
      explanation: `${route.name} is a ${route.depth} route. ${route.description}`,
      audioPrompt: `Is ${route.name} a short, medium, or deep route?`,
    })
  })

  questions.push({
    id: 'route-tf-slant-timing',
    type: 'true-false',
    category: 'routes',
    prompt: 'On a Slant route, the QB should wait until you finish your cut before throwing.',
    answer: false,
    explanation: 'Slant is a timing route — the QB throws BEFORE you cut! Anticipation is key.',
    audioPrompt: 'True or false: On a slant, the QB waits until you cut.',
  })

  // --- PLAYS ---
  plays.forEach((play) => {
    const formation = getFormationById(play.formationId)
    questions.push({
      id: `play-mc-${play.id}`,
      type: 'multiple-choice',
      category: 'plays',
      prompt: `What is the main concept of the "${play.name}" play?`,
      options: shuffle([
        play.concept,
        ...pickWrong(plays.map((p) => p.concept), play.concept),
      ]),
      answer: play.concept,
      explanation: `${play.name}: ${play.description}. QB read: ${play.qbRead}`,
      audioPrompt: `What is the concept of the ${play.name} play?`,
    })

    questions.push({
      id: `play-form-${play.id}`,
      type: 'multiple-choice',
      category: 'plays',
      prompt: `Which formation does "${play.name}" use?`,
      options: shuffle(formations.map((f) => f.name)),
      answer: formation?.name,
      explanation: `${play.name} runs out of ${formation?.name}. ${play.description}`,
      audioPrompt: `Which formation does ${play.name} use?`,
    })

    play.assignments.slice(0, 2).forEach((assign, i) => {
      const pos = getPositionById(assign.positionId)
      const route = getRouteById(assign.routeId)
      if (!pos || !route) return
      questions.push({
        id: `play-assign-${play.id}-${i}`,
        type: 'multiple-choice',
        category: 'plays',
        prompt: `In "${play.name}", what route does the ${pos.shortName} run?`,
        options: shuffle(routes.map((r) => r.name)),
        answer: route.name,
        explanation: `${pos.shortName} runs a ${route.name} in ${play.name}. ${assign.note || ''}`,
        audioPrompt: `In ${play.name}, what route does the ${pos.name} run?`,
        visual: { playId: play.id, mode: 'play' },
      })
    })

    questions.push({
      id: `play-audio-${play.id}`,
      type: 'multiple-choice',
      category: 'plays',
      prompt: `Coach B calls: "${play.audioCall}" — Which play is this?`,
      options: shuffle(plays.map((p) => p.name)),
      answer: play.name,
      explanation: `"${play.audioCall}" = ${play.name}. ${play.concept}`,
      audioPrompt: play.audioCall,
      visual: { playId: play.id, mode: 'play' },
    })
  })

  return questions
}

export const CATEGORIES = [
  { id: 'positions', label: 'Positions', emoji: '🏈', color: '#e85d75' },
  { id: 'formations', label: 'Formations', emoji: '📐', color: '#6c5ce7' },
  { id: 'routes', label: 'Routes', emoji: '🏃‍♀️', color: '#00b894' },
  { id: 'plays', label: 'Plays', emoji: '📋', color: '#fdcb6e' },
  { id: 'mixed', label: 'Mixed Quiz', emoji: '🎯', color: '#0984e3' },
]

export function getQuestionsForCategory(categoryId, count = 10) {
  const all = generateAllQuestions()
  const filtered =
    categoryId === 'mixed'
      ? all
      : all.filter((q) => q.category === categoryId)
  return shuffle(filtered).slice(0, Math.min(count, filtered.length))
}
