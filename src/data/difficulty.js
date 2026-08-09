/** @typedef {'rookie' | 'veteran' | 'allpro'} DifficultyId */

/**
 * @typedef {Object} Difficulty
 * @property {DifficultyId} id
 * @property {string} label
 * @property {number | null} seconds - null = no time limit
 * @property {string} blurb
 */

/** @type {Difficulty[]} */
export const DIFFICULTIES = [
  {
    id: 'rookie',
    label: 'Rookie',
    seconds: null,
    blurb: 'No time limit',
  },
  {
    id: 'veteran',
    label: 'Veteran',
    seconds: 7,
    blurb: '7 seconds per question',
  },
  {
    id: 'allpro',
    label: 'All-Pro',
    seconds: 4,
    blurb: '4 seconds per question',
  },
]

const STORAGE_KEY = 'coach-b-difficulty'

/** @returns {DifficultyId} */
export function loadDifficulty() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
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

/** @param {DifficultyId} id */
export function getDifficulty(id) {
  return DIFFICULTIES.find((d) => d.id === id) || DIFFICULTIES[0]
}
