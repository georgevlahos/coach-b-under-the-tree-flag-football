import { positions } from './data/positions.js'
import { formations } from './data/formations.js'
import { routes } from './data/routes.js'
import { plays } from './data/plays.js'
import { CATEGORIES, getQuestionsForCategory } from './data/questions.js'
import { loadProgress, BADGE_INFO, resetProgress } from './quiz/progress.js'
import { QuizSession, renderQuiz } from './quiz/engine.js'
import { renderField, injectFieldDefs } from './visual/field.js'
import {
  isSpeechSupported,
  isAudioModeEnabled,
  setAudioMode,
  speakPlayCall,
} from './audio/speech.js'

/** @type {'home' | 'learn' | 'quiz' | 'progress' | 'play-call'} */
let currentPage = 'home'
let learnTab = 'positions'
/** @type {QuizSession | null} */
let activeSession = null
let quizCategory = 'mixed'

const app = document.getElementById('app')

export function initApp() {
  render()
}

function render() {
  app.innerHTML = `
    <div class="app-shell">
      ${renderHeader()}
      <main class="main-content">${renderPage()}</main>
      ${renderNav()}
    </div>
  `
  bindEvents()
}

function renderHeader() {
  const progress = loadProgress()
  const audioOn = isAudioModeEnabled()
  return `
    <header class="site-header">
      <div class="header-brand">
        <span class="tree-icon">🌳</span>
        <div>
          <h1 class="site-title">Coach B</h1>
          <p class="site-subtitle">Under the Tree — Flag Football</p>
        </div>
      </div>
      <div class="header-stats">
        ${progress.streak > 0 ? `<span class="streak-badge">🔥 ${progress.streak}</span>` : ''}
        <span class="score-badge">✅ ${progress.totalCorrect}</span>
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
        <button class="nav-item ${currentPage === item.id || (currentPage === 'play-call' && item.id === 'learn') ? 'active' : ''}" data-page="${item.id}">
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
    case 'play-call': return renderPlayCallPractice()
    default: return renderHome()
  }
}

function renderHome() {
  return `
    <section class="hero">
      <div class="hero-tree">🌳🏈</div>
      <h2>Welcome, Player!</h2>
      <p class="hero-text">
        Learn flag football positions, formations, routes, and plays —
        then test yourself with tons of quizzes!
      </p>
      <div class="hero-actions">
        <button class="btn btn-primary btn-lg" data-action="start-quiz">Start a Quiz 🎯</button>
        <button class="btn btn-secondary btn-lg" data-action="go-learn">Study First 📖</button>
      </div>
    </section>
    <section class="home-cards">
      ${CATEGORIES.filter((c) => c.id !== 'mixed').map((cat) => {
        const p = loadProgress().byCategory[cat.id]
        const pct = p ? Math.round((p.correct / Math.max(p.answered, 1)) * 100) : 0
        return `
          <button class="home-card" data-quiz-cat="${cat.id}" style="--card-color:${cat.color}">
            <span class="home-card-emoji">${cat.emoji}</span>
            <span class="home-card-label">${cat.label}</span>
            <span class="home-card-stat">${p ? `${pct}% accuracy` : 'Not started'}</span>
          </button>`
      }).join('')}
    </section>
    <section class="feature-banner">
      <p>🎧 <strong>Audio mode</strong> is ready! Toggle the speaker icon to hear Coach B's questions and play calls.</p>
    </section>
  `
}

function renderLearn() {
  const tabs = [
    { id: 'positions', label: 'Positions' },
    { id: 'formations', label: 'Formations' },
    { id: 'routes', label: 'Routes' },
    { id: 'plays', label: 'Plays' },
  ]
  return `
    <section class="learn-page">
      <div class="learn-tabs">
        ${tabs.map((t) => `<button class="learn-tab ${learnTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div class="learn-content" id="learn-content">${renderLearnTab()}</div>
      <div class="learn-quiz-cta">
        <button class="btn btn-primary" data-quiz-cat="${learnTab}">Quiz me on ${learnTab}! 🎯</button>
      </div>
    </section>
  `
}

function renderLearnTab() {
  switch (learnTab) {
    case 'positions':
      return positions.map((p) => `
        <article class="learn-card">
          <div class="learn-card-header">
            <span class="learn-emoji">${p.emoji}</span>
            <h3>${p.name}</h3>
          </div>
          <p>${p.description}</p>
          <p class="learn-job"><strong>Job:</strong> ${p.job}</p>
          <p class="learn-tip">💡 ${p.tip}</p>
        </article>
      `).join('')
    case 'formations':
      return formations.map((f) => `
        <article class="learn-card">
          <h3>${f.name}</h3>
          <div class="learn-field" data-formation="${f.id}"></div>
          <p>${f.description}</p>
          <p class="learn-tip">💡 ${f.whenToUse}</p>
        </article>
      `).join('')
    case 'routes':
      return routes.map((r) => `
        <article class="learn-card">
          <div class="learn-card-header">
            <h3>${r.name}</h3>
            <span class="depth-badge depth-${r.depth}">${r.depth}</span>
          </div>
          <p class="route-nick">${r.nickname}</p>
          <div class="learn-field" data-route="${r.id}"></div>
          <p>${r.description}</p>
          <p class="learn-tip">💡 ${r.tip}</p>
        </article>
      `).join('')
    case 'plays':
      return `
        ${plays.map((play) => `
          <article class="learn-card">
            <h3>${play.name}</h3>
            <div class="learn-field" data-play="${play.id}"></div>
            <p>${play.description}</p>
            <p><strong>Concept:</strong> ${play.concept}</p>
            <p><strong>QB Read:</strong> ${play.qbRead}</p>
            <p class="play-call-line">📢 "${play.audioCall}"</p>
            <button class="btn btn-sm btn-secondary" data-hear-play="${play.id}">🔊 Hear the call</button>
          </article>
        `).join('')}
        <div class="play-practice-cta">
          <button class="btn btn-primary" data-action="play-call-practice">🎧 Play Call Practice Mode</button>
        </div>
      `
    default:
      return ''
  }
}

function renderQuizPage() {
  if (activeSession && !activeSession.isComplete) {
    return `<div id="quiz-container"></div>`
  }
  if (activeSession?.isComplete) {
    return `<div id="quiz-container"></div>`
  }

  return `
    <section class="quiz-picker">
      <h2>Pick a Quiz</h2>
      <p class="quiz-picker-sub">How many questions?</p>
      <div class="count-picker">
        ${[5, 10, 15, 20].map((n) => `<button class="btn btn-count ${n === 10 ? 'active' : ''}" data-count="${n}">${n}</button>`).join('')}
      </div>
      <div class="category-picker">
        ${CATEGORIES.map((cat) => `
          <button class="category-btn ${quizCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}" style="--cat-color:${cat.color}">
            <span>${cat.emoji}</span>
            <span>${cat.label}</span>
          </button>
        `).join('')}
      </div>
      <button class="btn btn-primary btn-lg btn-start-quiz">Let's Go! 🏈</button>
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
        ${CATEGORIES.filter((c) => c.id !== 'mixed').map((cat) => {
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

function renderPlayCallPractice() {
  return `
    <section class="play-call-page">
      <h2>🎧 Play Call Practice</h2>
      <p>Coach B will call a play — you identify it! (Audio mode recommended)</p>
      <div id="play-call-quiz"></div>
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

  app.querySelector('[data-action="start-quiz"]')?.addEventListener('click', () => {
    currentPage = 'quiz'
    render()
  })

  app.querySelector('[data-action="go-learn"]')?.addEventListener('click', () => {
    currentPage = 'learn'
    render()
  })

  app.querySelector('[data-action="play-call-practice"]')?.addEventListener('click', () => {
    currentPage = 'play-call'
    render()
    startPlayCallQuiz()
  })

  app.querySelectorAll('[data-quiz-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      quizCategory = btn.dataset.quizCat
      currentPage = 'quiz'
      startQuiz(quizCategory, 10)
    })
  })

  app.querySelectorAll('.learn-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      learnTab = tab.dataset.tab
      render()
    })
  })

  app.querySelectorAll('.learn-field').forEach((el) => {
    const opts = {}
    if (el.dataset.formation) opts.formationId = el.dataset.formation
    if (el.dataset.route) opts.routeId = el.dataset.route
    if (el.dataset.play) opts.playId = el.dataset.play
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

  app.querySelectorAll('.category-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      quizCategory = btn.dataset.cat
      app.querySelectorAll('.category-btn').forEach((b) => b.classList.toggle('active', b === btn))
    })
  })

  app.querySelectorAll('.btn-count').forEach((btn) => {
    btn.addEventListener('click', () => {
      app.querySelectorAll('.btn-count').forEach((b) => b.classList.toggle('active', b === btn))
    })
  })

  app.querySelector('.btn-start-quiz')?.addEventListener('click', () => {
    const count = Number(app.querySelector('.btn-count.active')?.dataset.count || 10)
    startQuiz(quizCategory, count)
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
      renderQuiz(container, activeSession, (action) => {
        if (action === 'retry') startQuiz(quizCategory, activeSession.questions.length)
        else {
          activeSession = null
          currentPage = 'quiz'
          render()
        }
      })
    }
  }
}

function startQuiz(category, count) {
  const questions = getQuestionsForCategory(category, count)
  activeSession = new QuizSession(questions, category)
  currentPage = 'quiz'
  render()
}

function startPlayCallQuiz() {
  const playQuestions = getQuestionsForCategory('plays', 8).filter((q) => q.id.startsWith('play-audio-'))
  activeSession = new QuizSession(playQuestions, 'plays')
  const container = app.querySelector('#play-call-quiz')
  if (container) {
    renderQuiz(container, activeSession, (action) => {
      activeSession = null
      if (action === 'home') currentPage = 'learn'
      else currentPage = 'play-call'
      render()
      if (action === 'retry') startPlayCallQuiz()
    })
    if (isAudioModeEnabled() && activeSession.current) {
      speakPlayCall(plays.find((p) => p.name === activeSession.current.answer) || plays[0])
    }
  }
}
