import './style.css'
import { initApp } from './app.js'

const BASE_TITLE = 'Coach B Under the Tree — Flag Football'

function applyEnvTabTitle() {
  const host = window.location.hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
    document.title = `LOCAL ${BASE_TITLE}`
  } else if (host.startsWith('beta.')) {
    document.title = `BETA ${BASE_TITLE}`
  } else {
    document.title = BASE_TITLE
  }
}

applyEnvTabTitle()
initApp()
