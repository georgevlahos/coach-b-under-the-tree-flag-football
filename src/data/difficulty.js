/** @typedef {'rookie' | 'probowler'} DifficultyId */

/**
 * @typedef {Object} Difficulty
 * @property {DifficultyId} id
 * @property {string} label
 * @property {number | null} seconds - null = no time limit
 * @property {number} speedBonusSeconds - correct under this many seconds earns a bonus
 * @property {string} blurb
 */

export const SPEED_BONUS_POINTS = 1

/** @type {Difficulty[]} */
export const DIFFICULTIES = [
  {
    id: 'rookie',
    label: 'Rookie',
    seconds: 25,
    speedBonusSeconds: 8,
    blurb: '25 seconds · speed bonus under 8s',
  },
  {
    id: 'probowler',
    label: 'Pro Bowler',
    seconds: 8,
    speedBonusSeconds: 4,
    blurb: '8 seconds · speed bonus under 4s',
  },
]

const STORAGE_KEY = 'coach-b-difficulty'

/** @returns {DifficultyId} */
export function loadDifficulty() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'allpro' || saved === 'veteran') return 'probowler'
    if (DIFFICULTIES.some((d) => d.id === saved)) return /** @type {DifficultyId} */ (saved)
  } catch {
    /* ignore */
  }
  return 'rookie'
}

/** @param {DifficultyId} id */
export function saveDifficulty(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

/** @param {string} id */
export function getDifficulty(id) {
  return DIFFICULTIES.find((d) => d.id === id) || DIFFICULTIES[0]
}
