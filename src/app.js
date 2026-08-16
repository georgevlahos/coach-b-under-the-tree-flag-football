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
import { QuizSession, renderQuiz, abortQuiz } from './quiz/engine.js'
import { renderField, injectFieldDefs } from './visual/field.js'
import {
  getRunnablePlays,
  mountRunPlayField,
  animateRunPlay,
  mountLearnRouteField,
} from './visual/runPlay.js'
import { mountPlayCallMovie } from './learn/playCallMovie.js'
import {
  isAudioModeEnabled,
  isSpeechSupported,
  setAudioMode,
  speakPlayCall,
  stopSpeaking,
} from './audio/speech.js'

/** @type {'home' | 'learn' | 'quiz' | 'progress'} */
let currentPage = 'home'
let learnTab = 'formations'
/** @type {{ destroy: () => void } | null} */
let playCallMovie = null
/** @type {QuizSession | null} */
let activeSession = null

/** End any in-progress quiz (timers + speech) before leaving or restarting. */
function endActiveQuiz() {
  abortQuiz()
  stopSpeaking()
  activeSession = null
  showYouAreIntro = false
  showRouteReview = false
  app.classList.remove('cue-audio-focus')
}
/** Show "You are the …" splash before play-call quiz questions */
let showYouAreIntro = false
/** Show mini route sheet before Rookie routes quiz */
let showRouteReview = false
let quizCategory = 'routes'
let quizCueMode = 'audio'
let quizCount = 8
/** @type {string} */
let quizPosition = 'X'
/** @type {import('./data/difficulty.js').DifficultyId} */
let quizDifficulty = loadDifficulty()

const app = document.getElementById('app')

export function initApp() {
  render()
}

function render() {
  playCallMovie?.destroy()
  playCallMovie = null

  const quizFit = currentPage === 'quiz'
  // Quiz picker keeps full brand; active quiz drops title text for vertical space
  const headerCompact = quizFit && Boolean(activeSession)
  app.innerHTML = `
    <div class="app-shell ${quizFit ? 'quiz-fit' : ''}">
      ${renderHeader(headerCompact)}
      <main class="main-content ${quizFit ? 'main-content--quiz' : ''}">${renderPage()}</main>
      ${renderNav()}
    </div>
  `
  bindEvents()
}

function renderHeader(compact = false) {
  const audioOn = isAudioModeEnabled()
  const audioTitle = audioOn ? 'Turn audio off' : 'Turn audio on'
  return `
    <header class="site-header ${compact ? 'site-header--compact' : ''}">
      <div class="header-brand">
        <span class="tree-icon" aria-hidden="true">🌳</span>
        ${compact
          ? '<span class="visually-hidden">Coach B Under the Tree — Flag Football</span>'
          : `<div>
              <h1 class="site-title">Coach B</h1>
              <p class="site-subtitle">Under the Tree — Flag Football</p>
            </div>`}
      </div>
      ${isSpeechSupported() ? `
        <div class="header-stats">
          <button
            type="button"
            class="btn btn-icon ${audioOn ? 'active' : ''}"
            id="toggle-audio"
            title="${audioTitle}"
            aria-label="${audioTitle}"
            aria-pressed="${audioOn ? 'true' : 'false'}"
          >
            ${audioOn ? '🔊' : '🔇'}
          </button>
        </div>` : ''}
    </header>
  `
}

function renderNav() {
  const items = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'learn', label: 'Learn', icon: '📖' },
    { id: 'quiz', label: 'Quizzes', icon: '🎯' },
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
        <button class="btn btn-primary btn-lg" data-action="go-learn"><span class="hero-cta-word">Learn</span>On Routes, Formations &amp; Play Calls</button>
        <button class="btn btn-secondary btn-lg" data-action="go-quiz"><span class="hero-cta-word">Quiz Me</span>On Routes, Formations &amp; Play Calls</button>
      </div>
    </section>
  `
}

function renderLearn() {
  const tabs = [
    { id: 'formations', label: 'Formations' },
    { id: 'routes', label: 'Routes' },
    { id: 'how-calls', label: 'How Play Calls Work' },
    { id: 'plays', label: 'Play Call Examples' },
  ]
  if (learnTab === 'positions') learnTab = 'routes'
  return `
    <section class="learn-page">
      <div class="learn-tabs">
        ${tabs.map((t) => `<button class="learn-tab ${learnTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div class="learn-content" id="learn-content">${renderLearnTab()}</div>
    </section>
  `
}

function renderLearnTab() {
  switch (learnTab) {
    case 'how-calls':
      return `<div class="pcm-host" id="pcm-host"></div>`
    case 'formations':
      return formations.map((f) => `
        <article class="learn-card">
          <h3>${f.name}</h3>
          <div class="learn-field" data-formation="${f.id}"></div>
          <p>${f.description}</p>
          <p class="learn-tip">${f.listenFor.replace(/\n/g, '<br>')}</p>
        </article>
      `).join('')
    case 'routes':
      return `
        <div class="route-review route-review--learn" aria-label="Routes at a glance">
          <div class="route-review-heading">
            <h2 class="route-review-title">Routes at a glance</h2>
            <button type="button" class="btn btn-sm btn-secondary" id="route-tip-toggle" aria-pressed="false">
              Tip to Remember
            </button>
          </div>
          <div class="route-tip-panel hidden" id="route-tip-panel" hidden>
            <p class="route-tip-line route-tip-line--straight">
              <strong>Routes 1 &amp; 0 Both Straight</strong> up the field
            </p>
            <p class="route-tip-line route-tip-line--even">
              <strong>Routes 2, 4, 6, 8 Evens In</strong> towards the center of the field
            </p>
            <p class="route-tip-line route-tip-line--odd">
              <strong>Routes 3, 5, 7, 9 Odds Out</strong> towards the sideline
            </p>
          </div>
          ${routeReviewGridHtml()}
        </div>
        <div class="learn-routes-divider" role="separator" aria-hidden="true">
          <span>Learn each route</span>
        </div>
        ${routes
          .map(
            (r) => `
        <article class="learn-card">
          <div class="learn-card-header">
            <h3>${formatRoute(r)}</h3>
            <span class="depth-badge depth-${r.depth}">${r.depth}</span>
          </div>
          <div class="learn-field learn-field--run" data-learn-route="${r.id}"></div>
          <p>${r.description}</p>
        </article>`,
          )
          .join('')}
      `
    case 'plays':
      return getRunnablePlays(plays).map((play) => `
        <article class="learn-card learn-card--play" data-play-card="${play.id}">
          <div class="play-card-header">
            <h3 class="play-call-title">${play.call}</h3>
            <div class="play-card-actions">
              <button class="btn btn-sm btn-secondary" data-hear-play="${play.id}">Hear the call</button>
              <button class="btn btn-sm btn-primary" data-run-play-btn="${play.id}">Run the Play</button>
            </div>
          </div>
          <div class="learn-field learn-field--run" data-run-play="${play.id}"></div>
          <ul class="assignment-list">
            ${['X', 'L', 'R', 'Z', 'H'].map((id) => {
              const a = play.parsed.assignments[id]
              return `<li><strong>${id}:</strong> ${a?.label || '—'}</li>`
            }).join('')}
          </ul>
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
          ${[8, 16].map((n) => `<button class="btn btn-count ${n === quizCount ? 'active' : ''}" data-count="${n}">${n}</button>`).join('')}
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
            <div class="cue-picker-row">
              <button class="btn btn-cue ${quizCueMode === 'both' ? 'active' : ''}" data-cue="both">Text + Audio</button>
              <button class="btn btn-cue ${quizCueMode === 'text' ? 'active' : ''}" data-cue="text">Text only</button>
              <button class="btn btn-cue ${quizCueMode === 'audio' ? 'active' : ''}" data-cue="audio">Audio Focus</button>
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
    const next = !isAudioModeEnabled()
    setAudioMode(next)
    if (!next) stopSpeaking()
    render()
  })

  app.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPage = btn.dataset.page
      endActiveQuiz()
      render()
    })
  })

  app.querySelector('[data-action="go-learn"]')?.addEventListener('click', () => {
    currentPage = 'learn'
    endActiveQuiz()
    render()
  })

  app.querySelector('[data-action="go-quiz"]')?.addEventListener('click', () => {
    currentPage = 'quiz'
    endActiveQuiz()
    render()
  })

  app.querySelectorAll('[data-quiz-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      quizCategory = btn.dataset.quizCat
      currentPage = 'quiz'
      endActiveQuiz()
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

  const pcmHost = app.querySelector('#pcm-host')
  if (pcmHost) {
    playCallMovie = mountPlayCallMovie(pcmHost)
  }

  mountRouteReviewFields(app)
  bindRouteTipToggle(app)

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

  app.querySelectorAll('.btn-cue[data-cue]').forEach((btn) => {
    btn.addEventListener('click', () => {
      quizCueMode = btn.dataset.cue
      app.querySelectorAll('.btn-cue[data-cue]').forEach((b) => b.classList.toggle('active', b === btn))
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

      if (showRouteReview && activeSession.category === 'routes') {
        renderRouteReview(container)
      } else if (showYouAreIntro && activeSession.category === 'play-calls') {
        renderYouAreIntro(container, activeSession.positionId)
      } else {
        renderQuiz(container, activeSession, (action) => {
          if (action === 'retry') startQuiz(quizCategory, activeSession.questions.length)
          else {
            endActiveQuiz()
            currentPage = 'quiz'
            render()
          }
        })
      }
    }
  }
}

/**
 * Shared 2×5 mini route grid markup (numbers 0–9).
 * @returns {string}
 */
function routeReviewGridHtml() {
  // Tree order: 1–9, then 0 last (bottom-right in the 2×5 glance grid)
  const ordered = [...routes].sort((a, b) => {
    const aKey = a.number === 0 ? 10 : a.number
    const bKey = b.number === 0 ? 10 : b.number
    return aKey - bKey
  })
  return `
    <div class="route-review-grid">
      ${ordered
        .map(
          (r) => `
        <div class="route-review-cell" data-route-number="${r.number}" data-tip-group="${tipGroupForRoute(r.number)}">
          <div class="route-review-field" data-review-route="${r.id}"></div>
          <p class="route-review-label"><span class="route-review-num">${r.number}</span> ${r.name}</p>
        </div>`,
        )
        .join('')}
    </div>
  `
}

/** @param {number} n */
function tipGroupForRoute(n) {
  if (n === 0 || n === 1) return 'straight'
  if (n % 2 === 0) return 'even'
  return 'odd'
}

/**
 * Mount mini diagrams into any `[data-review-route]` fields under `root`.
 * @param {ParentNode} root
 */
function mountRouteReviewFields(root) {
  root.querySelectorAll('[data-review-route]').forEach((el) => {
    const route = getRouteById(/** @type {HTMLElement} */ (el).dataset.reviewRoute)
    if (route) {
      mountLearnRouteField(/** @type {HTMLElement} */ (el), route, {
        animate: false,
        className: 'field-svg--mini-route',
        mini: true,
      })
    }
  })
}

/**
 * Learn → Routes: Tip to Remember highlights straight / even-in / odd-out groups.
 * @param {ParentNode} root
 */
function bindRouteTipToggle(root) {
  const host = root.querySelector('.route-review--learn')
  const btn = root.querySelector('#route-tip-toggle')
  const panel = root.querySelector('#route-tip-panel')
  if (!host || !btn || !panel) return

  btn.addEventListener('click', () => {
    const on = !host.classList.contains('route-review--tips-on')
    host.classList.toggle('route-review--tips-on', on)
    btn.setAttribute('aria-pressed', on ? 'true' : 'false')
    btn.classList.toggle('active', on)
    panel.classList.toggle('hidden', !on)
    panel.hidden = !on
  })
}

/**
 * Mini 2×5 route sheet before Rookie routes quiz — no scrolling.
 * @param {HTMLElement} container
 */
function renderRouteReview(container) {
  container.innerHTML = `
    <div class="route-review" role="dialog" aria-modal="true" aria-labelledby="route-review-heading">
      <h2 class="route-review-title" id="route-review-heading">Routes at a glance</h2>
      ${routeReviewGridHtml()}
      <div class="route-review-footer">
        <p class="route-review-ready">Are you ready? Click OK and we'll start the quiz!</p>
        <button type="button" class="btn btn-primary" id="route-review-ok">OK</button>
      </div>
    </div>
  `

  mountRouteReviewFields(container)

  container.querySelector('#route-review-ok')?.addEventListener('click', () => {
    showRouteReview = false
    render()
  })
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
  abortQuiz()
  stopSpeaking()
  const opts = category === 'play-calls' ? { positionId: quizPosition } : {}
  const questions = getQuestionsForCategory(category, count, opts)
  const pos = category === 'play-calls' ? getPositionById(quizPosition) : null
  activeSession = new QuizSession(questions, category, {
    positionId: pos?.id,
    positionLabel: pos ? formatQuizPositionLabel(pos) : null,
    difficultyId: quizDifficulty,
  })
  showYouAreIntro = category === 'play-calls'
  showRouteReview = category === 'routes' && quizDifficulty === 'rookie'
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
