import { getFormationById } from '../data/formations.js'
import { getRouteByNumber } from '../data/routes.js'
import { positions } from '../data/positions.js'

const POS_COLORS = {
  X: '#eb6d20',
  L: '#f4a261',
  R: '#e9c46a',
  Z: '#eb6d20',
  H: '#2a9d8f',
  C: '#6c757d',
  Q: '#0d1167',
}

/** Practice field: ~35 yards long, LOS 10 yards from the bottom */
const FIELD_YARDS = 35
const LOS_FROM_BOTTOM = 10
const FIELD_LEFT = 4
const FIELD_RIGHT = 96
const FIELD_TOP = 5
const FIELD_BOTTOM = 97
const FIELD_HEIGHT = FIELD_BOTTOM - FIELD_TOP
const YARD = FIELD_HEIGHT / FIELD_YARDS

const LOS_Y = yardToY(LOS_FROM_BOTTOM)

/** Route depths in yards (≈ 5-yard “boxes”: short 1.25, medium 2.5, deep 3.5) */
const DEPTH_YARDS = {
  short: 6.25,
  medium: 12.5,
  deep: 17.5,
}

const FIELD_BOUNDS = {
  left: FIELD_LEFT + 2,
  right: FIELD_RIGHT - 2,
  top: FIELD_TOP + 2,
  bottom: FIELD_BOTTOM - 2,
}

const TOWARD_SIDELINE = new Set(['Arrow', 'Out', 'Wheel', 'Corner'])
const TOWARD_MIDDLE = new Set(['Slant', 'In', 'Post'])

/** Yards from bottom of field → SVG y (0 = bottom, 35 = top) */
function yardToY(yardsFromBottom) {
  return FIELD_BOTTOM - yardsFromBottom * YARD
}

/** Plays with motion tags are skipped in Learn → Run the Play for now */
export function playHasMotion(play) {
  return Object.values(play?.parsed?.assignments || {}).some((a) => a?.kind === 'motion')
}

export function getRunnablePlays(allPlays) {
  return allPlays.filter((p) => !playHasMotion(p))
}

/**
 * Map formation spots onto the 35-yard field (LOS at 10 yards from bottom).
 * @param {Record<string, { x: number, y: number }>} spots
 */
function mapSpotsToYardField(spots) {
  const OLD_LOS = 68
  const mapped = {}
  for (const [id, spot] of Object.entries(spots)) {
    const behindOld = spot.y - OLD_LOS
    // Old diagram: ~10 SVG units ≈ a short step; place H/Q a few yards behind LOS
    const behindYards = behindOld > 0 ? (behindOld / 10) * 3.5 : 0
    const yardsFromBottom = Math.max(1.5, LOS_FROM_BOTTOM - behindYards)
    mapped[id] = { x: spot.x, y: yardToY(yardsFromBottom) }
  }
  return mapped
}

/**
 * Build the shared 35-yard field SVG (Learn Run the Play + play-call quiz).
 * @param {{
 *   formationId: string,
 *   highlightId?: string,
 *   markerId?: string,
 *   className?: string,
 *   ariaLabel?: string,
 *   includeRouteLayer?: boolean,
 * }} opts
 */
export function createYardFieldSvg(opts) {
  const {
    formationId,
    highlightId = null,
    markerId = `yard-field-${formationId}`,
    className = '',
    ariaLabel = 'Football field diagram',
    includeRouteLayer = false,
  } = opts

  const formation = getFormationById(formationId)
  const spots = mapSpotsToYardField(formation ? { ...formation.spots } : {})

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('class', `field-svg field-svg--run ${className}`.trim())
  svg.setAttribute('aria-label', ariaLabel)
  svg.dataset.markerId = markerId
  svg.dataset.formationId = formationId

  svg.innerHTML = `
    <defs>
      <marker id="${markerId}" viewBox="0 0 10 10" refX="8" refY="5"
        markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#fdcb6e"/>
      </marker>
    </defs>
    <rect x="${FIELD_LEFT}" y="${FIELD_TOP}" width="${FIELD_RIGHT - FIELD_LEFT}"
      height="${FIELD_HEIGHT}" fill="#386641" rx="1"/>
    ${yardGrid()}
    <line x1="${FIELD_LEFT}" y1="${LOS_Y}" x2="${FIELD_RIGHT}" y2="${LOS_Y}"
      stroke="#eb6d20" stroke-width="0.7" stroke-dasharray="2.2,1.1"/>
    <text x="50" y="${LOS_Y - 1.2}" text-anchor="middle" fill="#ffedd5"
      font-size="2.3" font-weight="700" opacity="0.95">LINE OF SCRIMMAGE</text>
    ${includeRouteLayer ? '<g class="run-routes"></g>' : ''}
    ${playerMarkers(spots, highlightId)}
  `

  return svg
}

/**
 * Mount the 35-yard field into a container (play-call quiz / shared use).
 * @param {HTMLElement} container
 * @param {{ formationId: string, highlightId?: string, className?: string }} opts
 */
export function mountYardFormationField(container, opts) {
  container.innerHTML = ''
  const svg = createYardFieldSvg({
    formationId: opts.formationId,
    highlightId: opts.highlightId,
    className: opts.className || 'quiz-field',
    markerId: `yard-quiz-${opts.formationId}-${opts.highlightId || 'none'}`,
    ariaLabel: 'Play call formation',
  })
  container.appendChild(svg)
  return svg
}

/**
 * Mount a 35-yard formation field for route animation (players stay put).
 * @param {HTMLElement} container
 * @param {import('../data/plays.js').Play} play
 */
export function mountRunPlayField(container, play) {
  container.innerHTML = ''
  const svg = createYardFieldSvg({
    formationId: play.formationId,
    markerId: `run-arrow-${play.id}`,
    className: '',
    ariaLabel: `Run play: ${play.call}`,
    includeRouteLayer: true,
  })
  container.appendChild(svg)
  return svg
}

/**
 * Animate route arrows from X/L/R/Z/H (circles stay fixed).
 * @param {SVGSVGElement} svg
 * @param {import('../data/plays.js').Play} play
 */
export function animateRunPlay(svg, play) {
  const layer = svg.querySelector('.run-routes')
  if (!layer) return

  layer.innerHTML = ''
  const formation = getFormationById(play.formationId)
  const spots = mapSpotsToYardField(formation ? { ...formation.spots } : {})
  const markerId = svg.dataset.markerId || `run-arrow-${play.id}`

  // Paint order: slots under H, outside receivers (X/Z) always on top
  const runners = ['L', 'R', 'H', 'X', 'Z']
  const paths = []
  const defs = svg.querySelector('defs')

  for (const id of runners) {
    const assignment = play.parsed.assignments[id]
    if (!assignment || assignment.kind !== 'route' || assignment.routeNumber == null) continue
    const route = getRouteByNumber(assignment.routeNumber)
    const spot = spots[id]
    if (!route || !spot) continue

    const color = POS_COLORS[id] || '#fdcb6e'
    const tipId = `${markerId}-${id}`
    if (defs && !svg.querySelector(`#${CSS.escape(tipId)}`)) {
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
      marker.setAttribute('id', tipId)
      marker.setAttribute('viewBox', '0 0 10 10')
      marker.setAttribute('refX', '8')
      marker.setAttribute('refY', '5')
      marker.setAttribute('markerWidth', '3.5')
      marker.setAttribute('markerHeight', '3.5')
      marker.setAttribute('orient', 'auto-start-reverse')
      const tip = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      tip.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z')
      tip.setAttribute('fill', color)
      marker.appendChild(tip)
      defs.appendChild(marker)
    }

    const pathPts = buildAnimatedPath(spot, route)
    const d = pathPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    el.setAttribute('d', d)
    el.setAttribute('fill', 'none')
    el.setAttribute('stroke', color)
    el.setAttribute('stroke-width', '1.1')
    el.setAttribute('stroke-linecap', 'round')
    el.setAttribute('stroke-linejoin', 'round')
    el.setAttribute('marker-end', `url(#${tipId})`)
    el.classList.add('run-route-path')
    el.dataset.position = id
    layer.appendChild(el)
    paths.push(el)
  }

  requestAnimationFrame(() => {
    paths.forEach((el, i) => {
      const length = el.getTotalLength()
      el.style.strokeDasharray = String(length)
      el.style.strokeDashoffset = String(length)
      el.style.opacity = '1'
      const delay = i * 80
      const duration = 1100 + Math.min(400, length * 8)
      el.getBoundingClientRect()
      el.style.transition = `stroke-dashoffset ${duration}ms ease-out ${delay}ms`
      el.style.strokeDashoffset = '0'
    })
  })
}

/** Thin lines every 5 yards, thicker every 10; small yard numbers on the sidelines */
function yardGrid() {
  let out = ''

  // Hash marks / depth lines
  for (let yd = 0; yd <= FIELD_YARDS; yd += 5) {
    const y = yardToY(yd)
    const isTen = yd % 10 === 0
    const sw = isTen ? 0.45 : 0.2
    const op = isTen ? 0.45 : 0.28
    out += `<line x1="${FIELD_LEFT}" y1="${y}" x2="${FIELD_RIGHT}" y2="${y}"
      stroke="#fff" stroke-width="${sw}" opacity="${op}"/>`
  }

  // Light lengthwise guides
  for (const x of [25, 50, 75]) {
    out += `<line x1="${x}" y1="${FIELD_TOP}" x2="${x}" y2="${FIELD_BOTTOM}"
      stroke="#fff" stroke-width="0.1" opacity="0.12"/>`
  }

  // Small yard markers (yards from bottom of this 35-yard field)
  for (let yd = 5; yd <= FIELD_YARDS - 5; yd += 5) {
    const y = yardToY(yd)
    const label = String(yd)
    const weight = yd % 10 === 0 ? 700 : 500
    const size = yd % 10 === 0 ? 2.1 : 1.7
    out += `<text x="${FIELD_LEFT + 2.2}" y="${y + 0.7}" fill="#fff" font-size="${size}"
      font-weight="${weight}" opacity="0.7">${label}</text>`
    out += `<text x="${FIELD_RIGHT - 2.2}" y="${y + 0.7}" text-anchor="end" fill="#fff"
      font-size="${size}" font-weight="${weight}" opacity="0.7">${label}</text>`
  }

  return out
}

/** @param {{ x: number, y: number }} spot @param {import('../data/routes.js').Route} route */
function buildAnimatedPath(spot, route) {
  const origin = route.path[0]
  let rel = route.path.map((p) => ({
    dx: p.x - origin.x,
    dy: p.y - origin.y,
  }))

  rel = scaleToDepth(rel, route.depth)
  rel = orientLaterals(rel, spot, route)
  rel = fitRelInsideField(spot, rel)

  return rel.map((p) => ({
    x: spot.x + p.dx,
    y: spot.y + p.dy,
  }))
}

/** @param {{ dx: number, dy: number }[]} rel @param {string} depth */
function scaleToDepth(rel, depth) {
  const targetUp = (DEPTH_YARDS[depth] || DEPTH_YARDS.medium) * YARD
  const maxUp = Math.max(...rel.map((p) => -p.dy), 0)
  const maxLat = Math.max(...rel.map((p) => Math.abs(p.dx)), 0)

  // Flat / release routes (Arrow): ~6 yards toward the sideline
  if (maxUp < YARD * 1.2 && maxLat > 0.5) {
    const scale = (6 * YARD) / maxLat
    return rel.map((p) => ({ dx: p.dx * scale, dy: p.dy * scale }))
  }

  const scale = maxUp > 0.5 ? targetUp / maxUp : 1
  return rel.map((p) => ({ dx: p.dx * scale, dy: p.dy * scale }))
}

function orientLaterals(rel, spot, route) {
  const left = spot.x < 50
  const name = route.name

  if (TOWARD_SIDELINE.has(name)) {
    const dir = left ? -1 : 1
    return rel.map((p) => ({
      dx: p.dx === 0 ? 0 : dir * Math.abs(p.dx),
      dy: p.dy,
    }))
  }

  if (TOWARD_MIDDLE.has(name)) {
    const dir = left ? 1 : -1
    return rel.map((p) => ({
      dx: p.dx === 0 ? 0 : dir * Math.abs(p.dx),
      dy: p.dy,
    }))
  }

  return rel
}

function fitRelInsideField(spot, rel) {
  const { left, right, top, bottom } = FIELD_BOUNDS
  let scaleX = 1
  let scaleY = 1

  for (const p of rel) {
    if (p.dx < 0) {
      const maxDx = left - spot.x
      if (p.dx < maxDx && maxDx < 0) scaleX = Math.min(scaleX, maxDx / p.dx)
    } else if (p.dx > 0) {
      const maxDx = right - spot.x
      if (p.dx > maxDx && maxDx > 0) scaleX = Math.min(scaleX, maxDx / p.dx)
    }

    if (p.dy < 0) {
      const maxDy = top - spot.y
      if (p.dy < maxDy && maxDy < 0) scaleY = Math.min(scaleY, maxDy / p.dy)
    } else if (p.dy > 0) {
      const maxDy = bottom - spot.y
      if (p.dy > maxDy && maxDy > 0) scaleY = Math.min(scaleY, maxDy / p.dy)
    }
  }

  return rel.map((p) => ({
    dx: p.dx * scaleX,
    dy: p.dy * scaleY,
  }))
}

function playerMarkers(spots, highlightId = null) {
  return Object.entries(spots)
    .map(([id, spot]) => {
      const pos = positions.find((p) => p.id === id)
      const label = pos?.shortName || id
      const color = POS_COLORS[id] || '#dfe6e9'
      const isHighlight = highlightId && id === highlightId
      const r = isHighlight ? 3.35 : 2.6
      const stroke = isHighlight ? '#fff' : 'rgba(255,255,255,0.5)'
      const sw = isHighlight ? 0.7 : 0.3
      const fontSize = isHighlight ? 2.35 : 2.1
      const fontWeight = isHighlight ? '800' : 'bold'
      const cls = isHighlight
        ? 'player-marker player-marker--session'
        : 'player-marker'
      return `
        <g class="${cls}" data-position="${id}">
          <circle cx="${spot.x}" cy="${spot.y}" r="${r}" fill="${color}"
            stroke="${stroke}" stroke-width="${sw}"/>
          <text x="${spot.x}" y="${spot.y + 0.9}" text-anchor="middle" fill="#fff"
            font-size="${fontSize}" font-weight="${fontWeight}">${label}</text>
        </g>`
    })
    .join('')
}
