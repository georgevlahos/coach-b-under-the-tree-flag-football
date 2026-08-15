import { getQuizPositions, getPositionById } from './data/positions.js'
import { formations } from './data/formations.js'
import { routes, formatRoute, getRouteById } from './data/routes.js'
import { plays } from './data/plays.js'
import { CATEGORIES, getQuestionsForCategory } from './data/questions.js'
import {
  DIFFICULTIES,
  loadDifficulty,
  saveDifficulty,
  getDifficulty,
} from './data/difficulty.js'
import { loadProgress, BADGE_INFO, resetProgress } from './quiz/progress.js'
import { QuizSession, renderQuiz } from './quiz/engine.js'
import { renderField, injectFieldDefs } from './visual/field.js'
import {
  getRunnablePlays,
  mountRunPlayField,
  animateRunPlay,
  mountLearnRouteField,
} from './visual/runPlay.js'
import {
  isSpeechSupported,
  isAudioModeEnabled,
  setAudioMode,
  speakPlayCall,
} from './audio/speech.js'

/** @type {'home' | 'learn' | 'quiz' | 'progress'} */
let currentPage = 'home'
let learnTab = 'routes'
/** @type {QuizSession | null} */
let activeSession = null
/** Show "You are the …" splash before play-call quiz questions */
let showYouAreIntro = false
let quizCategory = 'routes'
let quizCueMode = 'both'
let quizCount = 5
/** @type {string} */
let quizPosition = 'X'
/** @type {import('./data/difficulty.js').DifficultyId} */
let quizDifficulty = loadDifficulty()

const app = document.getElementById('app')

export function initApp() {
  render()
}

function render() {
  const quizFit = currentPage === 'quiz'
  app.innerHTML = `
    <div class="app-shell ${quizFit ? 'quiz-fit' : ''}">
      ${renderHeader(quizFit)}
      <main class="main-content ${quizFit ? 'main-content--quiz' : ''}">${renderPage()}</main>
      ${renderNav()}
    </div>
  `
  bindEvents()
}

function renderHeader(compact = false) {
  const audioOn = isAudioModeEnabled()
  return `
    <header class="site-header ${compact ? 'site-header--compact' : ''}">
      <div class="header-brand">
        <span class="tree-icon">🌳</span>
        <div>
          <h1 class="site-title">Coach B</h1>
          ${compact ? '' : '<p class="site-subtitle">Under the Tree — Flag Football</p>'}
        </div>
      </div>
      <div class="header-stats">
        ${isSpeechSupported() ? `
          <button class="btn btn-icon ${audioOn ? 'active' : ''}" id="toggle-audio" title="Audio quiz mode">
            ${audioOn ? '🔊' : '🔇'}
          </button>` : ''}
      </div>
    </header>
  `
}

function renderNav() {
  const items = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'learn', label: 'Learn', icon: '📖' },
    { id: 'quiz', label: 'Quiz', icon: '🎯' },
    { id: 'progress', label: 'Progress', icon: '🏆' },
  ]
  return `
    <nav class="bottom-nav">
      ${items.map((item) => `
        <button class="nav-item ${currentPage === item.id ? 'active' : ''}" data-page="${item.id}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </button>
      `).join('')}
    </nav>
  `
}

function renderPage() {
  switch (currentPage) {
    case 'home': return renderHome()
    case 'learn': return renderLearn()
    case 'quiz': return renderQuizPage()
    case 'progress': return renderProgressPage()
    default: return renderHome()
  }
}

function renderHome() {
  return `
    <section class="hero">
      <p class="hero-text">
        Learn your routes and what to run when Coach calls a play.
      </p>
      <div class="hero-actions">
        <button class="btn btn-primary btn-lg" data-action="go-learn">Learn about our Routes and Plays</button>
        <button class="btn btn-secondary btn-lg" data-quiz-cat="routes">Test Me on Routes</button>
        <button class="btn btn-secondary btn-lg" data-quiz-cat="play-calls">Test Me on Play Calls</button>
      </div>
    </section>
    <section class="feature-banner">
      <p>🔊 Toggle the speaker for audio play-call practice. You can also quiz with text-only cues.</p>
    </section>
  `
}

function renderLearn() {
  const tabs = [
    { id: 'routes', label: 'Routes' },
    { id: 'formations', label: 'Formations' },
    { id: 'plays', label: 'Play calls' },
  ]
  if (learnTab === 'positions') learnTab = 'routes'
  const quizCat = learnTab === 'plays' ? 'play-calls' : learnTab
  const quizLabel = learnTab === 'plays' ? 'play calls' : learnTab
  return `
    <section class="learn-page">
      <div class="learn-tabs">
        ${tabs.map((t) => `<button class="learn-tab ${learnTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div class="learn-content" id="learn-content">${renderLearnTab()}</div>
      <div class="learn-quiz-cta">
        <button class="btn btn-primary" data-quiz-cat="${quizCat}">Quiz me on ${quizLabel}!</button>
      </div>
    </section>
  `
}

function renderLearnTab() {
  switch (learnTab) {
    case 'formations':
      return formations.map((f) => `
        <article class="learn-card">
          <h3>${f.name}</h3>
          <div class="learn-field" data-formation="${f.id}"></div>
          <p>${f.description}</p>
          <p class="learn-tip"><strong>Listen for:</strong> ${f.listenFor}</p>
        </article>
      `).join('')
    case 'routes':
      return routes.map((r) => `
        <article class="learn-card">
          <div class="learn-card-header">
            <h3>${formatRoute(r)}</h3>
            <span class="depth-badge depth-${r.depth}">${r.depth}</span>
          </div>
          <div class="learn-field learn-field--run" data-learn-route="${r.id}"></div>
          <p>${r.description}</p>
        </article>
      `).join('')
    case 'plays':
      return getRunnablePlays(plays).map((play) => `
        <article class="learn-card learn-card--play" data-play-card="${play.id}">
          <h3 class="play-call-title">${play.call}</h3>
          <div class="learn-field learn-field--run" data-run-play="${play.id}"></div>
          <ul class="assignment-list">
            ${['X', 'L', 'R', 'Z', 'H'].map((id) => {
              const a = play.parsed.assignments[id]
              return `<li><strong>${id}:</strong> ${a?.label || '—'}</li>`
            }).join('')}
          </ul>
          <div class="play-card-actions">
            <button class="btn btn-sm btn-secondary" data-hear-play="${play.id}">Hear the call</button>
            <button class="btn btn-sm btn-primary" data-run-play-btn="${play.id}">Run the Play</button>
          </div>
        </article>
      `).join('')
    default:
      return ''
  }
}

function renderQuizPage() {
  if (activeSession) {
    return `<div id="quiz-container"></div>`
  }

  const playCallMode = quizCategory === 'play-calls'
  const quizPositions = getQuizPositions()
  const difficulty = getDifficulty(quizDifficulty)

  return `
    <section class="quiz-picker">
      <div class="quiz-picker-scroll">
        <h2>Pick a Quiz</h2>
        <p class="quiz-picker-sub">How many questions?</p>
        <div class="count-picker">
          ${[5, 10, 15, 20].map((n) => `<button class="btn btn-count ${n === quizCount ? 'active' : ''}" data-count="${n}">${n}</button>`).join('')}
        </div>
        <div class="category-picker">
          ${CATEGORIES.map((cat) => `
            <button class="category-btn ${quizCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}" style="--cat-color:${cat.color}">
              <span>${cat.emoji}</span>
              <span>${cat.label}</span>
            </button>
          `).join('')}
        </div>
        <div class="difficulty-picker-block">
          <p class="quiz-picker-sub">Difficulty</p>
          <div class="difficulty-picker">
            ${DIFFICULTIES.map((d) => `
              <button class="btn btn-difficulty ${quizDifficulty === d.id ? 'active' : ''}" data-difficulty="${d.id}" title="${d.blurb}">
                <span class="diff-label">${d.label}</span>
                <span class="diff-blurb">${d.blurb}</span>
              </button>
            `).join('')}
          </div>
          <p class="position-picker-hint">Current: <strong>${difficulty.label}</strong> — ${difficulty.blurb}</p>
        </div>
        ${playCallMode ? `
          <div class="position-picker-block">
            <p class="quiz-picker-sub">Test yourself as</p>
            <div class="position-picker">
              ${quizPositions.map((p) => `
                <button class="btn btn-position ${quizPosition === p.id ? 'active' : ''}" data-position="${p.id}" title="${p.name}">
                  ${p.shortName}
                </button>
              `).join('')}
            </div>
            <p class="position-picker-hint">You'll stay as <strong>${quizPosition}</strong> for every question.</p>
          </div>
          <div class="cue-picker">
            <p class="quiz-picker-sub">Play-call cues</p>
            <div class="count-picker">
              <button class="btn btn-count ${quizCueMode === 'both' ? 'active' : ''}" data-cue="both">Text + Audio</button>
              <button class="btn btn-count ${quizCueMode === 'text' ? 'active' : ''}" data-cue="text">Text only</button>
              <button class="btn btn-count ${quizCueMode === 'audio' ? 'active' : ''}" data-cue="audio">Audio focus</button>
            </div>
          </div>
        ` : ''}
      </div>
      <button class="btn btn-primary btn-lg btn-start-quiz">Let's Go!</button>
    </section>
  `
}

function renderProgressPage() {
  const p = loadProgress()
  const accuracy = p.totalAnswered ? Math.round((p.totalCorrect / p.totalAnswered) * 100) : 0
  return `
    <section class="progress-page">
      <h2>Your Progress</h2>
      <div class="progress-stats">
        <div class="stat-box"><span class="stat-num">${p.totalCorrect}</span><span class="stat-label">Correct</span></div>
        <div class="stat-box"><span class="stat-num">${p.totalAnswered}</span><span class="stat-label">Answered</span></div>
        <div class="stat-box"><span class="stat-num">${accuracy}%</span><span class="stat-label">Accuracy</span></div>
        <div class="stat-box"><span class="stat-num">${p.bestStreak}</span><span class="stat-label">Best Streak</span></div>
      </div>
      <h3>By Category</h3>
      <div class="category-progress">
        ${CATEGORIES.map((cat) => {
          const c = p.byCategory[cat.id] || { answered: 0, correct: 0 }
          const pct = c.answered ? Math.round((c.correct / c.answered) * 100) : 0
          return `
            <div class="cat-progress-row">
              <span>${cat.emoji} ${cat.label}</span>
              <div class="mini-bar"><div class="mini-bar-fill" style="width:${pct}%;background:${cat.color}"></div></div>
              <span>${c.correct}/${c.answered}</span>
            </div>`
        }).join('')}
      </div>
      <h3>Badges</h3>
      <div class="badges-grid">
        ${Object.entries(BADGE_INFO).map(([id, info]) => `
          <div class="badge ${p.badges.includes(id) ? 'earned' : 'locked'}">
            <span class="badge-emoji">${info.emoji}</span>
            <span class="badge-label">${info.label}</span>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-secondary btn-sm" id="reset-progress">Reset Progress</button>
    </section>
  `
}

function bindEvents() {
  injectFieldDefs(app)

  app.querySelector('#toggle-audio')?.addEventListener('click', () => {
    setAudioMode(!isAudioModeEnabled())
    render()
  })

  app.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPage = btn.dataset.page
      activeSession = null
      render()
    })
  })

  app.querySelector('[data-action="go-learn"]')?.addEventListener('click', () => {
    currentPage = 'learn'
    render()
  })

  app.querySelectorAll('[data-quiz-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      quizCategory = btn.dataset.quizCat
      currentPage = 'quiz'
      activeSession = null
      // Play calls: pick position first. Routes/formations can start immediately.
      if (quizCategory === 'play-calls') {
        render()
      } else {
        startQuiz(quizCategory, quizCount)
      }
    })
  })

  app.querySelectorAll('.learn-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      learnTab = tab.dataset.tab
      render()
    })
  })

  app.querySelectorAll('.learn-field').forEach((el) => {
    if (el.dataset.runPlay) {
      const play = plays.find((p) => p.id === el.dataset.runPlay)
      if (play) mountRunPlayField(el, play)
      return
    }
    if (el.dataset.learnRoute) {
      const route = getRouteById(el.dataset.learnRoute)
      if (route) mountLearnRouteField(el, route)
      return
    }
    const opts = { compact: true }
    if (el.dataset.formation) opts.formationId = el.dataset.formation
    if (el.dataset.route) opts.routeId = el.dataset.route
    el.appendChild(renderField(opts))
  })

  app.querySelectorAll('[data-hear-play]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const play = plays.find((p) => p.id === btn.dataset.hearPlay)
      if (play) {
        const wasOn = isAudioModeEnabled()
        if (!wasOn) setAudioMode(true)
        speakPlayCall(play).then(() => {
          if (!wasOn) setAudioMode(false)
        })
      }
    })
  })

  app.querySelectorAll('[data-run-play-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const playId = btn.dataset.runPlayBtn
      const play = plays.find((p) => p.id === playId)
      const field = app.querySelector(`.learn-field[data-run-play="${playId}"]`)
      const svg = field?.querySelector('svg')
      if (!play || !svg) return
      animateRunPlay(svg, play)
    })
  })

  app.querySelectorAll('.category-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      quizCategory = btn.dataset.cat
      render()
    })
  })

  app.querySelectorAll('.btn-count[data-count]').forEach((btn) => {
    btn.addEventListener('click', () => {
      quizCount = Number(btn.dataset.count)
      app.querySelectorAll('.btn-count[data-count]').forEach((b) => b.classList.toggle('active', b === btn))
    })
  })

  app.querySelectorAll('[data-position]').forEach((btn) => {
    btn.addEventListener('click', () => {
      quizPosition = btn.dataset.position
      render()
    })
  })

  app.querySelectorAll('[data-difficulty]').forEach((btn) => {
    btn.addEventListener('click', () => {
      quizDifficulty = /** @type {import('./data/difficulty.js').DifficultyId} */ (btn.dataset.difficulty)
      saveDifficulty(quizDifficulty)
      render()
    })
  })

  app.querySelectorAll('.btn-count[data-cue]').forEach((btn) => {
    btn.addEventListener('click', () => {
      quizCueMode = btn.dataset.cue
      app.querySelectorAll('.btn-count[data-cue]').forEach((b) => b.classList.toggle('active', b === btn))
      if (quizCueMode === 'audio' || quizCueMode === 'both') setAudioMode(true)
      if (quizCueMode === 'text') setAudioMode(false)
    })
  })

  app.querySelector('.btn-start-quiz')?.addEventListener('click', () => {
    if (quizCueMode === 'audio' || quizCueMode === 'both') setAudioMode(true)
    if (quizCueMode === 'text') setAudioMode(false)
    startQuiz(quizCategory, quizCount)
  })

  app.querySelector('#reset-progress')?.addEventListener('click', () => {
    if (confirm('Reset all progress and badges?')) {
      resetProgress()
      render()
    }
  })

  if (activeSession) {
    const container = app.querySelector('#quiz-container')
    if (container) {
      // Optionally hide written play-call cue in audio-focus mode
      if (quizCueMode === 'audio' && activeSession.current?.category === 'play-calls') {
        // strip visible cue after render via class on body
        app.classList.add('cue-audio-focus')
      } else {
        app.classList.remove('cue-audio-focus')
      }

      if (showYouAreIntro && activeSession.category === 'play-calls') {
        renderYouAreIntro(container, activeSession.positionId)
      } else {
        renderQuiz(container, activeSession, (action) => {
          if (action === 'retry') startQuiz(quizCategory, activeSession.questions.length)
          else {
            activeSession = null
            showYouAreIntro = false
            currentPage = 'quiz'
            render()
          }
        })
      }
    }
  }
}

/**
 * @param {HTMLElement} container
 * @param {string | null | undefined} positionId
 */
function renderYouAreIntro(container, positionId) {
  const pos = positionId ? getPositionById(positionId) : null
  const { letter, role } = formatYouAreParts(pos)
  container.innerHTML = `
    <div class="you-are-overlay" role="dialog" aria-modal="true" aria-labelledby="you-are-heading">
      <div class="you-are-card">
        <p class="you-are-text" id="you-are-heading">
          You are the <span class="you-are-letter">${letter}</span> ${role}!
        </p>
        <button type="button" class="btn btn-primary btn-lg" id="you-are-continue">Let's play!</button>
      </div>
    </div>
  `
  container.querySelector('#you-are-continue')?.addEventListener('click', () => {
    showYouAreIntro = false
    render()
  })
}

function startQuiz(category, count) {
  const opts = category === 'play-calls' ? { positionId: quizPosition } : {}
  const questions = getQuestionsForCategory(category, count, opts)
  const pos = category === 'play-calls' ? getPositionById(quizPosition) : null
  activeSession = new QuizSession(questions, category, {
    positionId: pos?.id,
    positionLabel: pos ? formatQuizPositionLabel(pos) : null,
    difficultyId: quizDifficulty,
  })
  showYouAreIntro = category === 'play-calls'
  currentPage = 'quiz'
  render()
}

/** @param {{ id: string, shortName: string } | null | undefined} pos */
function formatYouAreParts(pos) {
  if (!pos) return { letter: '?', role: 'Player' }
  const roles = {
    X: 'Outside Receiver',
    Z: 'Outside Receiver',
    L: 'Slot Receiver',
    R: 'Slot Receiver',
    H: 'Halfback',
  }
  return { letter: pos.shortName, role: roles[pos.id] || pos.name }
}

/** @param {{ id: string, shortName: string }} pos */
function formatQuizPositionLabel(pos) {
  const { letter, role } = formatYouAreParts(pos)
  return `${letter} ${role}`
}
