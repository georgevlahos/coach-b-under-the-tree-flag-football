import { positions } from '../data/positions.js'
import { getFormationById } from '../data/formations.js'
import { getRouteById, getRouteByNumber } from '../data/routes.js'
import { getPlayById } from '../data/plays.js'

const POS_COLORS = {
  X: '#eb6d20',
  L: '#f4a261',
  R: '#e9c46a',
  Z: '#eb6d20',
  H: '#2a9d8f',
  C: '#6c757d',
  Q: '#0d1167',
}

/** Render an SVG football field with optional overlays */
export function renderField(options = {}) {
  const {
    formationId,
    highlightId,
    routeId,
    playId,
    interactive = false,
    className = '',
    /** Crop top ~1/3 (end zone + unused field) — used on Learn formations/play calls */
    compact = false,
  } = options

  let spots = {}
  let routes = []

  if (playId) {
    const play = getPlayById(playId)
    const formation = play ? getFormationById(play.formationId) : null
    if (formation) spots = { ...formation.spots }
    if (play?.parsed?.assignments) {
      routes = Object.entries(play.parsed.assignments)
        .map(([positionId, a]) => {
          if (!a || a.routeNumber === undefined) return null
          const route = getRouteByNumber(a.routeNumber)
          const spot = spots[positionId] || { x: 50, y: 68 }
          if (!route) return null
          const offsetPath = route.path.map((p, i) =>
            i === 0 ? spot : { x: spot.x + (p.x - 50), y: p.y }
          )
          return { positionId, path: offsetPath, routeId: route.id }
        })
        .filter(Boolean)
    }
  } else if (formationId) {
    const formation = getFormationById(formationId)
    if (formation) spots = { ...formation.spots }
  } else if (routeId) {
    const route = getRouteById(routeId)
    if (route) routes = [{ path: route.path, routeId }]
    spots = { X: { x: 50, y: 68 } }
  } else {
    positions.forEach((p) => {
      if (p.fieldSpot) spots[p.id] = p.fieldSpot
    })
  }

  // Full field: 100×100. Compact: ~6×4 feel — drop top third (end zone + deep field).
  const viewBox = compact ? '0 34 100 66' : '0 0 100 100'
  const fieldTop = compact ? 34 : 22

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', viewBox)
  svg.setAttribute('class', `field-svg ${className}${compact ? ' field-svg--compact' : ''}`)
  svg.setAttribute('aria-label', 'Football field diagram')

  const endZone = compact
    ? ''
    : `
    <rect x="0" y="0" width="100" height="22" fill="#1b4332" opacity="0.35" rx="1"/>
    <text x="50" y="12" text-anchor="middle" fill="#0d1167" font-size="4" opacity="0.55" font-weight="700">END ZONE</text>`

  svg.innerHTML = `
    ${endZone}
    <rect x="2" y="${fieldTop}" width="96" height="${98 - fieldTop}" fill="#386641" rx="1"/>
    ${yardLines(fieldTop)}
    <line x1="2" y1="68" x2="98" y2="68" stroke="#f0ebe3" stroke-width="0.42" stroke-dasharray="2,1"/>
    ${routePaths(routes)}
    ${playerMarkers(spots, highlightId, interactive)}
  `

  return svg
}

/** @param {number} fieldTop */
function yardLines(fieldTop = 22) {
  let lines = ''
  for (let y = Math.ceil(fieldTop / 10) * 10; y <= 90; y += 10) {
    if (y <= fieldTop) continue
    lines += `<line x1="2" y1="${y}" x2="98" y2="${y}" stroke="#fff" stroke-width="0.15" opacity="0.25"/>`
  }
  for (const x of [25, 50, 75]) {
    lines += `<line x1="${x}" y1="${fieldTop}" x2="${x}" y2="98" stroke="#fff" stroke-width="0.1" opacity="0.15"/>`
  }
  return lines
}

function routePaths(routes) {
  return routes
    .map(({ path, routeId }) => {
      const d = path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      return `<path d="${d}" fill="none" stroke="#fdcb6e" stroke-width="0.8" stroke-dasharray="1.5,0.8" marker-end="url(#arrow)" data-route="${routeId}"/>`
    })
    .join('')
}

function playerMarkers(spots, highlightId, interactive) {
  return Object.entries(spots)
    .map(([id, spot]) => {
      const pos = positions.find((p) => p.id === id)
      const label = pos?.shortName || id
      const color = POS_COLORS[id] || '#dfe6e9'
      const isHighlight = id === highlightId
      const r = isHighlight ? 3.2 : 2.8
      const cursor = interactive ? 'pointer' : 'default'
      const stroke = isHighlight ? '#fff' : 'rgba(255,255,255,0.5)'
      const sw = isHighlight ? 0.6 : 0.3
      return `
        <g class="player-marker ${interactive ? 'interactive' : ''}" data-position="${id}" style="cursor:${cursor}">
          <circle cx="${spot.x}" cy="${spot.y}" r="${r}" fill="${color}" stroke="${stroke}" stroke-width="${sw}"
            ${interactive ? `tabindex="0" role="button" aria-label="${pos?.name || id}"` : ''}/>
          <text x="${spot.x}" y="${spot.y + 0.9}" text-anchor="middle" fill="#fff" font-size="2.2" font-weight="bold">${label}</text>
        </g>`
    })
    .join('')
}

export function bindFieldInteraction(svg, onPositionClick) {
  svg.querySelectorAll('.player-marker.interactive').forEach((g) => {
    const id = g.dataset.position
    const handler = () => onPositionClick?.(id)
    g.addEventListener('click', handler)
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handler()
      }
    })
  })
}

export function injectFieldDefs(container) {
  if (container.querySelector('#field-defs')) return
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  defs.setAttribute('id', 'field-defs')
  defs.setAttribute('width', '0')
  defs.setAttribute('height', '0')
  defs.innerHTML = `
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#fdcb6e"/>
      </marker>
    </defs>`
  container.prepend(defs)
}
