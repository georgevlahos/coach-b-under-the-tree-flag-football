const STORAGE_KEY = 'coach-b-progress'

/** @typedef {Object} Progress
 * @property {number} totalAnswered
 * @property {number} totalCorrect
 * @property {Record<string, { answered: number, correct: number }>} byCategory
 * @property {string[]} badges
 * @property {number} streak
 * @property {number} bestStreak
 */

/** @returns {Progress} */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return {
    totalAnswered: 0,
    totalCorrect: 0,
    byCategory: {},
    badges: [],
    streak: 0,
    bestStreak: 0,
  }
}

/** @param {Progress} progress */
export function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

/** @param {string} category @param {boolean} correct */
export function recordAnswer(category, correct) {
  const p = loadProgress()
  p.totalAnswered++
  if (correct) {
    p.totalCorrect++
    p.streak++
    if (p.streak > p.bestStreak) p.bestStreak = p.streak
  } else {
    p.streak = 0
  }
  if (!p.byCategory[category]) {
    p.byCategory[category] = { answered: 0, correct: 0 }
  }
  p.byCategory[category].answered++
  if (correct) p.byCategory[category].correct++

  checkBadges(p)
  saveProgress(p)
  return p
}

/** @param {Progress} p */
function checkBadges(p) {
  const badges = new Set(p.badges)
  if (p.totalCorrect >= 1) badges.add('first-down')
  if (p.totalCorrect >= 10) badges.add('ten-yard-line')
  if (p.totalCorrect >= 25) badges.add('midfield')
  if (p.totalCorrect >= 50) badges.add('red-zone')
  if (p.totalCorrect >= 100) badges.add('touchdown')
  if (p.bestStreak >= 5) badges.add('hot-streak')
  if (p.bestStreak >= 10) badges.add('on-fire')
  for (const cat of ['routes', 'play-calls', 'guess-the-play', 'formations']) {
    const c = p.byCategory[cat]
    if (c && c.correct >= 10) badges.add(`master-${cat}`)
  }
  p.badges = [...badges]
}

export const BADGE_INFO = {
  'first-down': { label: 'First Down!', emoji: '1️⃣' },
  'ten-yard-line': { label: '10 Yard Line', emoji: '🔟' },
  midfield: { label: 'Midfield Master', emoji: '🏟️' },
  'red-zone': { label: 'Red Zone!', emoji: '🔴' },
  touchdown: { label: 'TOUCHDOWN!', emoji: '🏆' },
  'hot-streak': { label: 'Hot Streak (5)', emoji: '🔥' },
  'on-fire': { label: 'On Fire! (10)', emoji: '💥' },
  'master-routes': { label: 'Route Runner', emoji: '🏃‍♀️' },
  'master-play-calls': { label: 'Play Caller', emoji: '📢' },
  'master-guess-the-play': { label: 'Play Spotter', emoji: '👀' },
  'master-formations': { label: 'Formation Expert', emoji: '📐' },
}

export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY)
}
