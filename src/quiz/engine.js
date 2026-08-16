import { recordAnswer } from './progress.js'
import { renderField, bindFieldInteraction, injectFieldDefs } from '../visual/field.js'
import {
  mountYardFormationField,
  mountLearnRouteField,
  mountRunPlayField,
  animateRunPlay,
} from '../visual/runPlay.js'
import {
  speakQuestion,
  speakFeedback,
  isAudioModeEnabled,
  replayQuestionAudio,
} from '../audio/speech.js'
import { getRouteById } from '../data/routes.js'
import { getPlayById } from '../data/plays.js'
import { getDifficulty, SPEED_BONUS_POINTS } from '../data/difficulty.js'

/** @typedef {import('../data/questions.js').QuizQuestion} QuizQuestion */

export class QuizSession {
  /**
   * @param {QuizQuestion[]} questions
   * @param {string} category
   * @param {{ positionId?: string, positionLabel?: string, difficultyId?: string }} [opts]
   */
  constructor(questions, category, opts = {}) {
    this.questions = questions
    this.category = category
    this.positionId = opts.positionId || null
    this.positionLabel = opts.positionLabel || opts.positionId || null
    this.difficultyId = opts.difficultyId || 'rookie'
    this.index = 0
    this.score = 0
    this.correctCount = 0
    this.bonusPoints = 0
    this.consecutiveCorrect = 0
    this.answered = false
    this.selectedAnswer = null
    this.timedOut = false
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

  get difficulty() {
    return getDifficulty(this.difficultyId)
  }

  /**
   * @param {string | boolean} answer
   * @param {{ elapsedSec?: number }} [timing]
   */
  submit(answer, timing = {}) {
    if (this.answered || this.isComplete) return null
    const q = this.current
    const correct = checkAnswer(q, answer)
    this.answered = true
    this.selectedAnswer = answer
    this.timedOut = false
    let speedBonus = false
    if (correct) {
      this.correctCount++
      this.score++
      this.consecutiveCorrect++
      const elapsed = timing.elapsedSec
      const bonusSec = this.difficulty.speedBonusSeconds
      if (elapsed != null && bonusSec != null && elapsed < bonusSec) {
        this.score += SPEED_BONUS_POINTS
        this.bonusPoints += SPEED_BONUS_POINTS
        speedBonus = true
      }
    } else {
      this.consecutiveCorrect = 0
    }
    recordAnswer(q.category, correct)
    return {
      correct,
      explanation: q.explanation,
      consecutiveCorrect: this.consecutiveCorrect,
      cheer: correct ? streakCheer(this.consecutiveCorrect) : null,
      timedOut: false,
      speedBonus,
    }
  }

  /** Auto-fail when the clock hits zero */
  submitTimeout() {
    if (this.answered || this.isComplete) return null
    const q = this.current
    this.answered = true
    this.selectedAnswer = null
    this.timedOut = true
    this.consecutiveCorrect = 0
    recordAnswer(q.category, false)
    return {
      correct: false,
      explanation: q.explanation,
      consecutiveCorrect: 0,
      cheer: null,
      timedOut: true,
      speedBonus: false,
    }
  }

  next() {
    this.index++
    this.answered = false
    this.selectedAnswer = null
    this.timedOut = false
  }
}

/** Normalize dashes/spaces so route labels match across hyphen variants. */
function normalizeAnswer(value) {
  return String(value)
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/** @param {QuizQuestion} q @param {string | boolean | number | null} answer */
function checkAnswer(q, answer) {
  if (answer == null) return false
  if (q.type === 'true-false') return answer === q.answer
  if (Array.isArray(q.answer)) {
    return q.answer.some((a) => normalizeAnswer(a) === normalizeAnswer(answer))
  }

  if (normalizeAnswer(answer) === normalizeAnswer(q.answer)) return true

  // Play-call route answers: accept bare number (e.g. "0") when it matches
  const routeNumber = q.meta?.routeNumber
  if (routeNumber != null && String(answer).trim() === String(routeNumber)) {
    return true
  }

  return false
}

/** @param {number} streak */
function streakCheer(streak) {
  if (streak < 2) return null
  if (streak >= 5) return 'On fire! 🔥 Keep it going!'
  if (streak >= 3) return 'Awesome streak — great job!'
  return 'Great job!'
}

/** @param {HTMLElement} container @param {QuizSession} session @param {() => void} onComplete */
export function renderQuiz(container, session, onComplete) {
  container.innerHTML = ''
  let timerId = null
  let rafId = null

  const clearTimers = () => {
    if (timerId != null) {
      clearTimeout(timerId)
      timerId = null
    }
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  if (session.isComplete) {
    renderResults(container, session, onComplete)
    return
  }

  const q = session.current
  const { current, total, score } = session.progress
  const difficulty = session.difficulty
  const limitSec = difficulty.seconds
  const isPlayCall = session.category === 'play-calls' || q.category === 'play-calls'
  const isGuessPlay = session.category === 'guess-the-play' || q.category === 'guess-the-play'
  const isFormation = session.category === 'formations' || q.category === 'formations'

  const el = document.createElement('div')
  el.className = `quiz-card quiz-card--fit${isPlayCall || isGuessPlay ? ' quiz-card--play-calls' : ''}${isGuessPlay ? ' quiz-card--guess-play' : ''}${isFormation ? ' quiz-card--formations' : ''}`
  const positionChip = session.positionId
    ? `
      <div class="quiz-position-chip" aria-live="polite" title="${session.positionLabel || session.positionId}">
        <span class="quiz-position-label">Your position</span>
        <span class="quiz-position-id">${session.positionId}</span>
      </div>`
    : ''

  el.innerHTML = `
    ${!isPlayCall && session.positionLabel ? `
      <div class="quiz-position-banner" aria-live="polite">
        <span class="quiz-position-label">Your position</span>
        <span class="quiz-position-id">${session.positionLabel}</span>
      </div>` : ''}
    <div class="quiz-header">
      <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${(current / total) * 100}%"></div></div>
      <div class="quiz-meta">
        <span>Q ${current}/${total}</span>
        <span class="quiz-score">Score: ${score}</span>
      </div>
      ${limitSec ? `
        <div class="quiz-timer" aria-live="polite">
          <div class="quiz-timer-track">
            <div class="quiz-timer-fill" id="quiz-timer-fill"></div>
          </div>
          <span class="quiz-timer-label" id="quiz-timer-label">${limitSec}s</span>
        </div>` : ''}
    </div>
    <div class="quiz-body">
      <div class="quiz-prompt-area${isPlayCall || isGuessPlay ? ' quiz-prompt-area--play' : ''}">
        <div class="quiz-prompt-row">
          <div class="quiz-prompt">${q.prompt}</div>
          ${isPlayCall ? positionChip : ''}
        </div>
        ${q.hint && !session.answered ? `<p class="quiz-hint">💡 ${q.hint}</p>` : ''}
        ${isPlayCall ? `
          <button type="button" class="btn btn-sm btn-replay" id="btn-replay-call">
            🔁 Hear call again
          </button>` : ''}
        ${isGuessPlay ? `
          <button type="button" class="btn btn-sm btn-replay" id="btn-replay-play">
            🔁 Run play again
          </button>` : ''}
      </div>
      <div class="quiz-visual" id="quiz-visual"></div>
      <div class="quiz-answers" id="quiz-answers"></div>
      <div class="quiz-feedback hidden" id="quiz-feedback"></div>
    </div>
    <div class="quiz-actions" id="quiz-actions"></div>
  `

  container.appendChild(el)
  injectFieldDefs(container)

  const visualEl = el.querySelector('#quiz-visual')
  const answersEl = el.querySelector('#quiz-answers')
  const feedbackEl = el.querySelector('#quiz-feedback')
  const actionsEl = el.querySelector('#quiz-actions')
  const timerFill = el.querySelector('#quiz-timer-fill')
  const timerLabel = el.querySelector('#quiz-timer-label')

  const runAnim = renderVisual(visualEl, q, session, (answer) => handleAnswer(answer))
  renderAnswers(answersEl, q, session)
  bindAnswerButtons(answersEl, q, (answer) => handleAnswer(answer))

  el.querySelector('#btn-replay-call')?.addEventListener('click', () => {
    replayQuestionAudio(q)
  })
  el.querySelector('#btn-replay-play')?.addEventListener('click', () => {
    const play = getPlayById(q.visual?.playId)
    const svg = visualEl.querySelector('svg')
    if (play && svg) animateRunPlay(svg, play)
  })

  let cancelled = false
  let timerStarted = false
  /** @type {number | null} */
  let questionStartedAt = null

  const cancelQuestion = () => {
    cancelled = true
    clearTimers()
  }

  const startQuestionTimer = () => {
    if (cancelled || timerStarted || session.answered || !limitSec || !timerFill || !timerLabel) return
    timerStarted = true
    questionStartedAt = performance.now()

    const started = questionStartedAt
    const tick = (now) => {
      if (session.answered || cancelled) return
      const elapsed = (now - started) / 1000
      const left = Math.max(0, limitSec - elapsed)
      const pct = (left / limitSec) * 100
      timerFill.style.width = `${pct}%`
      timerLabel.textContent = `${Math.ceil(left)}s`
      if (left <= 0) {
        handleAnswer(null, true)
        return
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    timerId = setTimeout(() => handleAnswer(null, true), limitSec * 1000 + 30)
  }

  // Hold at full time until the clock actually starts
  if (limitSec && timerFill && timerLabel) {
    timerFill.style.width = '100%'
    timerLabel.textContent = `${limitSec}s`
  }

  if (isGuessPlay) {
    // Hold the clock until the play animation finishes (same idea as waiting for audio)
    Promise.resolve(runAnim).finally(() => {
      if (cancelled || session.answered) return
      startQuestionTimer()
    })
  } else if (isAudioModeEnabled()) {
    // Don't start the clock until the spoken prompt/call finishes
    Promise.resolve(speakQuestion(q)).finally(() => {
      if (cancelled || session.answered) return
      startQuestionTimer()
    })
  } else {
    startQuestionTimer()
  }

  function handleAnswer(answer, fromTimeout = false) {
    if (session.answered) return
    const elapsedSec =
      questionStartedAt != null ? (performance.now() - questionStartedAt) / 1000 : null
    cancelQuestion()

    const result = fromTimeout
      ? session.submitTimeout()
      : session.submit(answer, { elapsedSec: elapsedSec ?? undefined })
    if (!result) return

    renderAnswers(answersEl, q, session)
    if (visualEl.querySelector('.field-svg')) {
      bindFieldInteraction(visualEl.querySelector('.field-svg'), null)
    }

    el.classList.add('quiz-card--answered')
    if (timerFill) timerFill.style.width = '0%'
    if (timerLabel) timerLabel.textContent = result.timedOut ? 'Time!' : ''

    const explanation = result.correct
      ? String(result.explanation || '').replace(/^\s*Correct answer is:\s*(<br\s*\/?>)?\s*/i, '')
      : result.explanation

    feedbackEl.classList.remove('hidden')
    feedbackEl.className = `quiz-feedback ${result.correct ? 'correct' : 'incorrect'}`
    feedbackEl.innerHTML = `
      <div class="feedback-top">
        <span class="feedback-icon">${result.correct ? '✅' : '❌'}</span>
        ${result.timedOut ? '<span class="feedback-cheer">Time\'s up!</span>' : ''}
        ${result.speedBonus ? `<span class="feedback-cheer">Speed bonus! +${SPEED_BONUS_POINTS}</span>` : ''}
        ${result.cheer ? `<span class="feedback-cheer">${result.cheer}</span>` : ''}
      </div>
      <div class="feedback-text">${explanation}</div>
    `

    if (isAudioModeEnabled()) speakFeedback(result.correct, result.consecutiveCorrect)

    // Refresh score in header after bonuses
    const scoreEl = el.querySelector('.quiz-score')
    if (scoreEl) scoreEl.textContent = `Score: ${session.score}`

    actionsEl.innerHTML = `
      <button class="btn btn-primary btn-next" id="btn-next">
        ${session.index + 1 >= session.questions.length ? 'See Results 🏆' : 'Next Question →'}
      </button>
    `
    actionsEl.querySelector('#btn-next').addEventListener('click', () => {
      cancelQuestion()
      session.next()
      renderQuiz(container, session, onComplete)
    })
  }
}

function renderVisual(el, q, session, onAnswer) {
  el.innerHTML = ''
  if (!q.visual) return Promise.resolve()

  if (q.visual.mode === 'route-field' || q.visual.mode === 'route-image') {
    const route = getRouteById(q.visual.routeId)
    if (route) {
      mountLearnRouteField(el, route, {
        className: 'quiz-field field-svg--quiz-yard',
        animate: false,
      })
    }
    return Promise.resolve()
  }

  if (q.visual.mode === 'run-play' && q.visual.playId) {
    const play = getPlayById(q.visual.playId)
    if (!play) return Promise.resolve()
    const svg = mountRunPlayField(el, play)
    svg.classList.add('field-svg--quiz-yard')
    return animateRunPlay(svg, play)
  }

  // Play-call / formation quiz: same 30-yard field as Learn → Play Calls
  if ((q.category === 'play-calls' || q.category === 'formations') && q.visual.formationId) {
    mountYardFormationField(el, {
      formationId: q.visual.formationId,
      highlightId: session.positionId || q.visual.highlightId,
      className: 'quiz-field field-svg--quiz-yard',
    })
    return Promise.resolve()
  }

  const opts = { className: 'quiz-field' }
  if (q.visual.mode === 'formation') {
    opts.formationId = q.visual.formationId
    if (q.visual.highlightId) opts.highlightId = q.visual.highlightId
  }
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
  return Promise.resolve()
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
        ${renderBtn('True', { value: true }, session)}
        ${renderBtn('False', { value: false }, session)}
      </div>`
    return
  }

  if (q.options) {
    el.innerHTML = `<div class="answer-grid">${q.options
      .map((opt, index) => renderBtn(opt, { index, value: opt }, session))
      .join('')}</div>`
  }
}

/**
 * @param {string} label
 * @param {{ value: string | boolean, index?: number }} opts
 * @param {QuizSession} session
 */
function renderBtn(label, opts, session) {
  const disabled = session.answered ? 'disabled' : ''
  let cls = 'btn btn-answer'
  const value = opts.value
  if (session.answered) {
    const q = session.current
    if (normalizeAnswer(value) === normalizeAnswer(q.answer)) cls += ' answer-correct'
    else if (
      session.selectedAnswer != null &&
      normalizeAnswer(value) === normalizeAnswer(session.selectedAnswer)
    ) {
      cls += ' answer-wrong'
    }
  }
  const indexAttr =
    opts.index != null ? ` data-answer-index="${opts.index}"` : ''
  const valueAttr =
    opts.index == null ? ` data-value="${escapeAttr(String(value))}"` : ''
  return `<button type="button" class="${cls}"${indexAttr}${valueAttr} ${disabled}>${label}</button>`
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function renderResults(container, session, onComplete) {
  const total = session.questions.length
  const correct = session.correctCount ?? session.score
  const pct = total ? Math.round((correct / total) * 100) : 0
  const msg =
    pct === 100 ? 'Perfect game! You\'re a star! ⭐' :
    pct >= 80 ? 'Great job — almost touchdown range!' :
    pct >= 60 ? 'Good work! Keep practicing!' :
    'Keep at it — every rep makes you better!'

  const bonusSec = session.difficulty.speedBonusSeconds
  const bonusLine =
    session.bonusPoints > 0
      ? `<p class="results-bonus">Speed bonuses: +${session.bonusPoints} (under ${bonusSec}s)</p>`
      : ''

  const half = Math.ceil(total / 2)
  const levelUpTip =
    session.difficultyId === 'rookie' && session.bonusPoints >= half
      ? `<p class="results-levelup">You're answering most questions within 8 seconds — try <strong>Pro Bowler</strong> for a tougher clock!</p>`
      : ''

  container.innerHTML = `
    <div class="quiz-results">
      <div class="results-trophy">${pct >= 80 ? '🏆' : '🏈'}</div>
      <h2>Quiz Complete!</h2>
      <p class="results-score">${session.score} pts</p>
      <p class="results-pct">${correct} / ${total} correct · ${pct}%</p>
      ${bonusLine}
      ${levelUpTip}
      <p class="results-msg">${msg}</p>
      <p class="results-difficulty">${session.difficulty.label} mode</p>
      <div class="results-actions">
        <button class="btn btn-primary" id="btn-retry">Try Again</button>
        <button class="btn btn-secondary" id="btn-home">Back Home</button>
      </div>
    </div>
  `

  container.querySelector('#btn-retry').addEventListener('click', () => onComplete('retry'))
  container.querySelector('#btn-home').addEventListener('click', () => onComplete('home'))
}

/** @param {HTMLElement} answersEl @param {QuizQuestion} q @param {(answer: string | boolean) => void} onAnswer */
function bindAnswerButtons(answersEl, q, onAnswer) {
  // Clear any sticky hover/focus from the previous question (common on iOS Safari)
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  answersEl.querySelectorAll('.btn-answer:not([disabled])').forEach((btn) => {
    btn.addEventListener('pointerup', () => {
      // Drop focus so iOS doesn't leave a sticky highlight
      requestAnimationFrame(() => btn.blur())
    })
    btn.addEventListener('click', () => {
      if (btn.dataset.answerIndex != null) {
        const idx = Number(btn.dataset.answerIndex)
        onAnswer(q.options[idx])
        return
      }
      const val = btn.dataset.value
      const parsed = val === 'true' ? true : val === 'false' ? false : val
      onAnswer(parsed)
    })
  })
}
