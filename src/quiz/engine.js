import { recordAnswer } from './progress.js'
import { renderField, bindFieldInteraction, injectFieldDefs } from '../visual/field.js'
import { speakQuestion, speakFeedback, isAudioModeEnabled } from '../audio/speech.js'

/** @typedef {import('../data/questions.js').QuizQuestion} QuizQuestion */

export class QuizSession {
  /** @param {QuizQuestion[]} questions @param {string} category */
  constructor(questions, category) {
    this.questions = questions
    this.category = category
    this.index = 0
    this.score = 0
    this.answered = false
    this.selectedAnswer = null
  }

  get current() {
    return this.questions[this.index]
  }

  get isComplete() {
    return this.index >= this.questions.length
  }

  get progress() {
    return { current: this.index + 1, total: this.questions.length, score: this.score }
  }

  /** @param {string | boolean} answer */
  submit(answer) {
    if (this.answered || this.isComplete) return null
    const q = this.current
    const correct = checkAnswer(q, answer)
    this.answered = true
    this.selectedAnswer = answer
    if (correct) this.score++
    recordAnswer(q.category, correct)
    return { correct, explanation: q.explanation }
  }

  next() {
    this.index++
    this.answered = false
    this.selectedAnswer = null
  }
}

/** @param {QuizQuestion} q @param {string | boolean} answer */
function checkAnswer(q, answer) {
  if (q.type === 'true-false') return answer === q.answer
  if (Array.isArray(q.answer)) return q.answer.includes(answer)
  return String(answer) === String(q.answer)
}

/** @param {HTMLElement} container @param {QuizSession} session @param {() => void} onComplete */
export function renderQuiz(container, session, onComplete) {
  container.innerHTML = ''

  if (session.isComplete) {
    renderResults(container, session, onComplete)
    return
  }

  const q = session.current
  const { current, total, score } = session.progress

  const el = document.createElement('div')
  el.className = 'quiz-card'
  el.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${(current / total) * 100}%"></div></div>
      <div class="quiz-meta">
        <span>Question ${current} of ${total}</span>
        <span class="quiz-score">Score: ${score}</span>
      </div>
    </div>
    <div class="quiz-prompt-area">
      <p class="quiz-prompt">${q.prompt}</p>
      ${q.hint && !session.answered ? `<p class="quiz-hint">💡 ${q.hint}</p>` : ''}
    </div>
    <div class="quiz-visual" id="quiz-visual"></div>
    <div class="quiz-answers" id="quiz-answers"></div>
    <div class="quiz-feedback hidden" id="quiz-feedback"></div>
    <div class="quiz-actions" id="quiz-actions"></div>
  `

  container.appendChild(el)
  injectFieldDefs(container)

  const visualEl = el.querySelector('#quiz-visual')
  const answersEl = el.querySelector('#quiz-answers')
  const feedbackEl = el.querySelector('#quiz-feedback')
  const actionsEl = el.querySelector('#quiz-actions')

  renderVisual(visualEl, q, session, (answer) => handleAnswer(answer))
  renderAnswers(answersEl, q, session)
  bindAnswerButtons(answersEl, (answer) => handleAnswer(answer))

  if (isAudioModeEnabled()) {
    speakQuestion(q)
  }

  function handleAnswer(answer) {
    if (session.answered) return
    const result = session.submit(answer)
    if (!result) return

    renderAnswers(answersEl, q, session)
    if (visualEl.querySelector('.field-svg')) {
      bindFieldInteraction(visualEl.querySelector('.field-svg'), null)
    }

    feedbackEl.classList.remove('hidden')
    feedbackEl.className = `quiz-feedback ${result.correct ? 'correct' : 'incorrect'}`
    feedbackEl.innerHTML = `
      <p class="feedback-icon">${result.correct ? '✅' : '❌'}</p>
      <p class="feedback-text">${result.explanation}</p>
    `

    if (isAudioModeEnabled()) speakFeedback(result.correct)

    actionsEl.innerHTML = `
      <button class="btn btn-primary btn-next" id="btn-next">
        ${session.index + 1 >= session.questions.length ? 'See Results 🏆' : 'Next Question →'}
      </button>
    `
    actionsEl.querySelector('#btn-next').addEventListener('click', () => {
      session.next()
      renderQuiz(container, session, onComplete)
    })
  }
}

function renderVisual(el, q, session, onAnswer) {
  el.innerHTML = ''
  if (!q.visual) return

  const opts = { className: 'quiz-field' }
  if (q.visual.mode === 'formation') opts.formationId = q.visual.formationId
  if (q.visual.mode === 'route') opts.routeId = q.visual.routeId
  if (q.visual.mode === 'play') opts.playId = q.visual.playId
  if (q.visual.mode === 'position' || q.type === 'identify') {
    opts.interactive = !session.answered
    if (q.visual.highlightId) opts.highlightId = q.visual.highlightId
  }

  if (q.type === 'identify' && !q.visual.mode) {
    opts.interactive = !session.answered
  }

  const svg = renderField(opts)
  el.appendChild(svg)
  if (opts.interactive) bindFieldInteraction(svg, onAnswer)
}

function renderAnswers(el, q, session) {
  el.innerHTML = ''
  if (q.type === 'identify' && q.visual?.mode !== 'formation') {
    el.innerHTML = '<p class="identify-hint">👆 Tap a player on the field above!</p>'
    return
  }

  if (q.type === 'true-false') {
    el.innerHTML = `
      <div class="answer-row tf-row">
        ${renderBtn('True', true, session)}
        ${renderBtn('False', false, session)}
      </div>`
    return
  }

  if (q.options) {
    el.innerHTML = `<div class="answer-grid">${q.options.map((opt) => renderBtn(opt, opt, session)).join('')}</div>`
  }
}

function renderBtn(label, value, session) {
  const disabled = session.answered ? 'disabled' : ''
  let cls = 'btn btn-answer'
  if (session.answered) {
    const q = session.current
    if (String(value) === String(q.answer)) cls += ' answer-correct'
    else if (String(value) === String(session.selectedAnswer)) cls += ' answer-wrong'
  }
  return `<button class="${cls}" data-value="${escapeAttr(String(value))}" ${disabled}>${label}</button>`
}

function escapeAttr(s) {
  return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function renderResults(container, session, onComplete) {
  const pct = Math.round((session.score / session.questions.length) * 100)
  const msg =
    pct === 100 ? 'Perfect game! You\'re a star! ⭐' :
    pct >= 80 ? 'Great job — almost touchdown range!' :
    pct >= 60 ? 'Good work! Keep practicing!' :
    'Keep at it — every rep makes you better!'

  container.innerHTML = `
    <div class="quiz-results">
      <div class="results-trophy">${pct >= 80 ? '🏆' : '🏈'}</div>
      <h2>Quiz Complete!</h2>
      <p class="results-score">${session.score} / ${session.questions.length}</p>
      <p class="results-pct">${pct}%</p>
      <p class="results-msg">${msg}</p>
      <div class="results-actions">
        <button class="btn btn-primary" id="btn-retry">Try Again</button>
        <button class="btn btn-secondary" id="btn-home">Back Home</button>
      </div>
    </div>
  `

  container.querySelector('#btn-retry').addEventListener('click', () => onComplete('retry'))
  container.querySelector('#btn-home').addEventListener('click', () => onComplete('home'))
}

function bindAnswerButtons(answersEl, onAnswer) {
  answersEl.querySelectorAll('.btn-answer:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.value
      const parsed = val === 'true' ? true : val === 'false' ? false : val
      onAnswer(parsed)
    })
  })
}
