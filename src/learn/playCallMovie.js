import { renderField } from '../visual/field.js'

/**
 * @typedef {{ id: string, title: string, html: string, formationId?: string }} MovieScene
 * @typedef {{ id: string, label: string, shortLabel: string, formationId: string, scenes: () => MovieScene[] }} PlayCallMovie
 */

/** Visual “slot” formula — numbers are listen-for slots */
function formulaGraphic(kind, opts = {}) {
  const { active = 'all' } = opts
  const on = (key) => (active === 'all' || active === key ? ' is-on' : '')

  const formationLabel =
    kind === 'spread' ? 'Spread' : kind === 'trips-left' ? 'Trips Left' : 'Trips Right'

  const nums =
    kind === 'spread'
      ? `
        <span class="pcm-bucket pcm-bucket--num${on('n1')}" data-bucket="n1">
          <span class="pcm-bucket-label">1st Number</span>
          <span class="pcm-bucket-hint">X &amp; Z</span>
        </span>
        <span class="pcm-bucket pcm-bucket--num${on('n2')}" data-bucket="n2">
          <span class="pcm-bucket-label">2nd Number</span>
          <span class="pcm-bucket-hint">L &amp; R</span>
        </span>`
      : kind === 'trips-left'
        ? `
        <span class="pcm-bucket pcm-bucket--num${on('n1')}" data-bucket="n1">
          <span class="pcm-bucket-label">1st Number</span>
          <span class="pcm-bucket-hint">X &amp; Z</span>
        </span>
        <span class="pcm-bucket pcm-bucket--num${on('n2')}" data-bucket="n2">
          <span class="pcm-bucket-label">2nd Number</span>
          <span class="pcm-bucket-hint">L</span>
        </span>
        <span class="pcm-bucket pcm-bucket--num${on('n3')}" data-bucket="n3">
          <span class="pcm-bucket-label">3rd Number</span>
          <span class="pcm-bucket-hint">R</span>
        </span>`
        : `
        <span class="pcm-bucket pcm-bucket--num${on('n1')}" data-bucket="n1">
          <span class="pcm-bucket-label">1st Number</span>
          <span class="pcm-bucket-hint">X &amp; Z</span>
        </span>
        <span class="pcm-bucket pcm-bucket--num${on('n2')}" data-bucket="n2">
          <span class="pcm-bucket-label">2nd Number</span>
          <span class="pcm-bucket-hint">R</span>
        </span>
        <span class="pcm-bucket pcm-bucket--num${on('n3')}" data-bucket="n3">
          <span class="pcm-bucket-label">3rd Number</span>
          <span class="pcm-bucket-hint">L</span>
        </span>`

  return `
    <div class="pcm-formula" aria-label="${formationLabel} play call formula">
      <p class="pcm-formula-name">${formationLabel}</p>
      <div class="pcm-formula-row">
        <span class="pcm-bucket pcm-bucket--formation${on('formation')}">
          <span class="pcm-bucket-label">Formation</span>
        </span>
        ${nums}
        <span class="pcm-plus" aria-hidden="true">+</span>
        <span class="pcm-bucket pcm-bucket--h${on('h')}">
          <span class="pcm-bucket-label">H</span>
          <span class="pcm-bucket-hint">Play and/or<br>Route #</span>
        </span>
        <span class="pcm-plus" aria-hidden="true">+</span>
        <span class="pcm-bucket pcm-bucket--tag pcm-bucket--optional${on('tag')}">
          <span class="pcm-bucket-label">Tag</span>
          <span class="pcm-bucket-hint">optional</span>
        </span>
      </div>
    </div>
  `
}

function spreadScenes() {
  return [
    {
      id: 'spread-formula',
      title: 'How Play Calls Work: Spread',
      html: `
        <p class="pcm-lead">Coach builds Spread calls from these slots — left to right.</p>
        ${formulaGraphic('spread')}
      `,
    },
    {
      id: 'spread-form',
      title: 'Slot 1 — Formation',
      formationId: 'spread',
      html: `
        ${formulaGraphic('spread', { active: 'formation' })}
        <p class="pcm-lead">First you hear <strong>Spread</strong> — where everyone lines up.</p>
      `,
    },
    {
      id: 'spread-n1',
      title: 'Slot — 1st Number',
      formationId: 'spread',
      html: `
        ${formulaGraphic('spread', { active: 'n1' })}
        <p class="pcm-lead">The <strong>1st Number</strong> is the outside slot.</p>
        <div class="pcm-map">
          <div class="pcm-map-row"><span><strong>X</strong> and <strong>Z</strong> both listen here for <span class="pcm-digit">1st Number</span></span></div>
        </div>
        <p class="pcm-example">Example: <strong>Spread <span class="pcm-hl">2</span>-3, H-7</strong> → X &amp; Z run <strong>2</strong></p>
      `,
    },
    {
      id: 'spread-n2',
      title: 'Slot — 2nd Number',
      formationId: 'spread',
      html: `
        ${formulaGraphic('spread', { active: 'n2' })}
        <p class="pcm-lead">The <strong>2nd Number</strong> is the slot.</p>
        <div class="pcm-map">
          <div class="pcm-map-row"><span><strong>L</strong> and <strong>R</strong> both listen here for <span class="pcm-digit">2nd Number</span></span></div>
        </div>
        <p class="pcm-example">Example: <strong>Spread 2-<span class="pcm-hl">3</span>, H-7</strong> → L &amp; R run <strong>3</strong></p>
      `,
    },
    {
      id: 'spread-h',
      title: 'H is always tagged',
      html: `
        ${formulaGraphic('spread', { active: 'h' })}
        <p class="pcm-lead">After the numbers, Coach always tags <strong>H</strong> — play and/or route number.</p>
        <ul class="pcm-bullets">
          <li><strong>H-0</strong> — H runs Vertical</li>
          <li><strong>H-fake run left</strong> — a play, not a route tree number</li>
        </ul>
      `,
    },
    {
      id: 'spread-tag',
      title: 'Optional Tag',
      html: `
        ${formulaGraphic('spread', { active: 'tag' })}
        <p class="pcm-lead">An optional <strong>Tag</strong> overrides someone’s number slot.</p>
        <ul class="pcm-bullets">
          <li><strong>Z-8</strong> — Z ignores the 1st Number and runs 8</li>
          <li><strong>L-Reverse</strong> — L runs a play instead of the 2nd Number</li>
        </ul>
        <p class="pcm-note">If Coach calls your position, that tag wins.</p>
      `,
    },
    {
      id: 'spread-example',
      title: 'Put it together',
      formationId: 'spread',
      html: `
        <p class="pcm-call pcm-call--xl">
          <span class="pcm-part pcm-part--formation is-on">Spread</span>
          <span class="pcm-part pcm-part--routes is-on">2-7</span><span class="pcm-comma">,</span>
          <span class="pcm-part pcm-part--tags is-on">H-0, Z-8</span>
        </p>
        <div class="pcm-assign">
          <span><strong>X</strong> 1st → 2</span>
          <span><strong>L</strong> 2nd → 7</span>
          <span><strong>R</strong> 2nd → 7</span>
          <span class="pcm-assign--hit"><strong>Z</strong> tag → 8</span>
          <span><strong>H</strong> → 0</span>
        </div>
        <p class="pcm-note">Z’s tag replaces the 1st Number slot.</p>
      `,
    },
    {
      id: 'spread-recap',
      title: 'Spread — remember',
      html: `
        ${formulaGraphic('spread')}
        <ol class="pcm-steps">
          <li><strong>1st Number</strong> → X &amp; Z</li>
          <li><strong>2nd Number</strong> → L &amp; R</li>
          <li><strong>H</strong> always tagged</li>
          <li>optional <strong>Tag</strong> wins</li>
        </ol>
      `,
    },
  ]
}

function tripsLeftScenes() {
  return [
    {
      id: 'tl-formula',
      title: 'How Play Calls Work: Trips Left',
      html: `
        <p class="pcm-lead">Trips Left uses <strong>three</strong> number slots.</p>
        ${formulaGraphic('trips-left')}
      `,
    },
    {
      id: 'tl-form',
      title: 'Slot 1 — Formation',
      formationId: 'trips-left',
      html: `
        ${formulaGraphic('trips-left', { active: 'formation' })}
        <p class="pcm-lead">First you hear <strong>Trips Left</strong> — three receivers bunched left, Z alone right.</p>
      `,
    },
    {
      id: 'tl-n1',
      title: 'Slot — 1st Number',
      formationId: 'trips-left',
      html: `
        ${formulaGraphic('trips-left', { active: 'n1' })}
        <p class="pcm-lead">The <strong>1st Number</strong> is still the outside slot.</p>
        <div class="pcm-map">
          <div class="pcm-map-row"><span><strong>X</strong> and <strong>Z</strong> both listen for the <span class="pcm-digit">1st Number</span></span></div>
        </div>
        <p class="pcm-example">Example: <strong>Trips Left <span class="pcm-hl">1</span>-9-3 …</strong> → X &amp; Z run <strong>1</strong></p>
      `,
    },
    {
      id: 'tl-n2',
      title: 'Slot — 2nd Number',
      formationId: 'trips-left',
      html: `
        ${formulaGraphic('trips-left', { active: 'n2' })}
        <p class="pcm-lead">On Trips Left, the <strong>2nd Number</strong> is <strong>L</strong>’s slot.</p>
        <div class="pcm-map">
          <div class="pcm-map-row"><span><strong>L</strong> listens for the <span class="pcm-digit">2nd Number</span></span></div>
        </div>
        <p class="pcm-example">Example: <strong>Trips Left 1-<span class="pcm-hl">9</span>-3 …</strong> → L runs <strong>9</strong></p>
      `,
    },
    {
      id: 'tl-n3',
      title: 'Slot — 3rd Number',
      formationId: 'trips-left',
      html: `
        ${formulaGraphic('trips-left', { active: 'n3' })}
        <p class="pcm-lead">The <strong>3rd Number</strong> is <strong>R</strong>’s slot.</p>
        <div class="pcm-map">
          <div class="pcm-map-row"><span><strong>R</strong> listens for the <span class="pcm-digit">3rd Number</span></span></div>
        </div>
        <p class="pcm-example">Example: <strong>Trips Left 1-9-<span class="pcm-hl">3</span> …</strong> → R runs <strong>3</strong></p>
      `,
    },
    {
      id: 'tl-h-tag',
      title: 'H + optional Tag',
      html: `
        ${formulaGraphic('trips-left', { active: 'h' })}
        <p class="pcm-lead"><strong>H</strong> is always tagged.</p>
        <p class="pcm-lead">An optional <strong>Tag</strong> can override any number slot with a new route #, a play, or motion.</p>
        <ul class="pcm-bullets">
          <li><strong>Hazer Right-3</strong> — H motions right, runs Arrow</li>
          <li><strong>Z-2</strong> — Z leaves the 1st Number slot and runs 2</li>
        </ul>
      `,
    },
    {
      id: 'tl-example',
      title: 'Put it together',
      formationId: 'trips-left',
      html: `
        <p class="pcm-call">
          <span class="pcm-part pcm-part--formation is-on">Trips Left</span>
          <span class="pcm-part pcm-part--routes is-on">1-9-3</span>
          <span class="pcm-part pcm-part--tags is-on">Hazer Right-3, Z-2</span>
        </p>
        <div class="pcm-assign">
          <span class="pcm-assign--hit"><strong>X</strong> 1st → 1</span>
          <span><strong>L</strong> 2nd → 9</span>
          <span><strong>R</strong> 3rd → 3</span>
          <span class="pcm-assign--hit"><strong>Z</strong> tag → 2</span>
          <span><strong>H</strong> motion → 3</span>
        </div>
      `,
    },
    {
      id: 'tl-recap',
      title: 'Trips Left — remember',
      html: `
        ${formulaGraphic('trips-left')}
        <ol class="pcm-steps">
          <li><strong>1st Number</strong> → X &amp; Z · <strong>2nd Number</strong> → L · <strong>3rd Number</strong> → R</li>
          <li>Written with dashes: <strong>1-9-3</strong></li>
          <li><strong>H</strong> always tagged</li>
          <li>optional <strong>Tag</strong> wins</li>
        </ol>
      `,
    },
  ]
}

function tripsRightScenes() {
  return [
    {
      id: 'tr-formula',
      title: 'How Play Calls Work: Trips Right',
      html: `
        <p class="pcm-lead">Same three number slots as Trips Left — but <strong>L</strong> and <strong>R</strong> swap.</p>
        ${formulaGraphic('trips-right')}
      `,
    },
    {
      id: 'tr-form',
      title: 'Slot 1 — Formation',
      formationId: 'trips-right',
      html: `
        ${formulaGraphic('trips-right', { active: 'formation' })}
        <p class="pcm-lead">First you hear <strong>Trips Right</strong> — X alone left, three receivers bunched right.</p>
      `,
    },
    {
      id: 'tr-n1',
      title: 'Slot — 1st Number',
      formationId: 'trips-right',
      html: `
        ${formulaGraphic('trips-right', { active: 'n1' })}
        <p class="pcm-lead">The <strong>1st Number</strong> is still the outside slot.</p>
        <div class="pcm-map">
          <div class="pcm-map-row"><span class="pcm-digit">1st</span> <span><strong>X</strong> and <strong>Z</strong> both listen here</span></div>
        </div>
        <p class="pcm-example">Example: <strong>Trips Right <span class="pcm-hl">1</span>-9-3 …</strong> → X &amp; Z run <strong>1</strong></p>
      `,
    },
    {
      id: 'tr-n2',
      title: 'Slot — 2nd Number',
      formationId: 'trips-right',
      html: `
        ${formulaGraphic('trips-right', { active: 'n2' })}
        <p class="pcm-lead">On Trips Right, the <strong>2nd Number</strong> is <strong>R</strong>’s slot (not L).</p>
        <div class="pcm-map">
          <div class="pcm-map-row"><span><strong>R</strong> listens for the <span class="pcm-digit">2nd Number</span></span></div>
        </div>
        <p class="pcm-example">Example: <strong>Trips Right 1-<span class="pcm-hl">9</span>-3 …</strong> → R runs <strong>9</strong></p>
      `,
    },
    {
      id: 'tr-n3',
      title: 'Slot — 3rd Number',
      formationId: 'trips-right',
      html: `
        ${formulaGraphic('trips-right', { active: 'n3' })}
        <p class="pcm-lead">The <strong>3rd Number</strong> is <strong>L</strong>’s slot.</p>
        <div class="pcm-map">
          <div class="pcm-map-row"><span class="pcm-digit">3rd</span> <span><strong>L</strong> listens here</span></div>
        </div>
        <p class="pcm-example">Example: <strong>Trips Right 1-9-<span class="pcm-hl">3</span> …</strong> → L runs <strong>3</strong></p>
        <p class="pcm-note">Remember: Trips Right flips the slots vs Trips Left.</p>
      `,
    },
    {
      id: 'tr-h-tag',
      title: 'H + optional Tag',
      html: `
        ${formulaGraphic('trips-right', { active: 'tag' })}
        <p class="pcm-lead"><strong>H</strong> is always tagged.</p>
        <p class="pcm-lead">An optional <strong>Tag</strong> can override any number slot with a new route #, a play, or motion.</p>
        <ul class="pcm-bullets">
          <li><strong>Hazer Left-3</strong> — H motions left, runs Arrow</li>
          <li><strong>L-Reverse</strong> — L leaves the 3rd Number slot for Reverse</li>
        </ul>
      `,
    },
    {
      id: 'tr-example',
      title: 'Put it together',
      formationId: 'trips-right',
      html: `
        <p class="pcm-call">
          <span class="pcm-part pcm-part--formation is-on">Trips Right</span>
          <span class="pcm-part pcm-part--routes is-on">9-1-1</span><span class="pcm-comma">,</span>
          <span class="pcm-part pcm-part--tags is-on">Hazer Right-3, L-Reverse</span>
        </p>
        <div class="pcm-assign">
          <span><strong>X</strong> 1st → 9</span>
          <span class="pcm-assign--hit"><strong>L</strong> tag → Reverse</span>
          <span><strong>R</strong> 2nd → 1</span>
          <span><strong>Z</strong> 1st → 9</span>
          <span><strong>H</strong> motion → 3</span>
        </div>
      `,
    },
    {
      id: 'tr-recap',
      title: 'Trips Right — remember',
      html: `
        ${formulaGraphic('trips-right')}
        <ol class="pcm-steps">
          <li><strong>1st Number</strong> → X &amp; Z · <strong>2nd Number</strong> → R · <strong>3rd Number</strong> → L</li>
          <li>Written with dashes: <strong>1-9-3</strong> — slots swapped vs Trips Left</li>
          <li><strong>H</strong> always tagged</li>
          <li>optional <strong>Tag</strong> wins</li>
        </ol>
      `,
    },
  ]
}

/** @type {PlayCallMovie[]} */
const MOVIES = [
  {
    id: 'spread',
    label: 'How Play Calls Work: Spread Formation',
    shortLabel: 'Spread',
    formationId: 'spread',
    scenes: spreadScenes,
  },
  {
    id: 'trips-left',
    label: 'How Play Calls Work: Trips Left Formation',
    shortLabel: 'Trips Left',
    formationId: 'trips-left',
    scenes: tripsLeftScenes,
  },
  {
    id: 'trips-right',
    label: 'How Play Calls Work: Trips Right Formation',
    shortLabel: 'Trips Right',
    formationId: 'trips-right',
    scenes: tripsRightScenes,
  },
]

/**
 * Mount one manual scene player into `root`.
 * @param {HTMLElement} root
 * @param {MovieScene[]} list
 * @param {string} movieTitle
 */
function mountScenePlayer(root, list, movieTitle) {
  let index = 0
  const uid = `pcm-${Math.random().toString(36).slice(2, 8)}`

  root.innerHTML = `
    <article class="pcm" role="region" aria-label="${movieTitle}">
      <div class="pcm-stage">
        <div class="pcm-progress" aria-hidden="true">
          ${list.map((_, i) => `<span class="pcm-tick" data-tick="${i}"></span>`).join('')}
        </div>
        <h3 class="pcm-title" id="${uid}-title"></h3>
        <div class="pcm-field" id="${uid}-field" hidden></div>
        <div class="pcm-body" id="${uid}-body"></div>
      </div>
      <div class="pcm-controls">
        <button type="button" class="btn btn-sm btn-secondary" id="${uid}-prev" aria-label="Previous">‹ Prev</button>
        <button type="button" class="btn btn-sm btn-primary" id="${uid}-next" aria-label="Next">Next ›</button>
        <button type="button" class="btn btn-sm btn-secondary" id="${uid}-restart" aria-label="Restart">↺ Start</button>
      </div>
      <p class="pcm-counter"><span id="${uid}-num">1</span> / ${list.length}</p>
    </article>
  `

  const titleEl = root.querySelector(`#${uid}-title`)
  const bodyEl = root.querySelector(`#${uid}-body`)
  const fieldEl = root.querySelector(`#${uid}-field`)
  const numEl = root.querySelector(`#${uid}-num`)
  const prevBtn = root.querySelector(`#${uid}-prev`)
  const nextBtn = root.querySelector(`#${uid}-next`)

  function showScene(animate) {
    const scene = list[index]
    if (titleEl) titleEl.textContent = scene.title
    if (numEl) numEl.textContent = String(index + 1)
    root.querySelectorAll('.pcm-tick').forEach((tick, i) => {
      tick.classList.toggle('is-done', i < index)
      tick.classList.toggle('is-active', i === index)
    })
    if (prevBtn) prevBtn.disabled = index === 0
    if (nextBtn) nextBtn.disabled = index >= list.length - 1

    if (fieldEl) {
      fieldEl.innerHTML = ''
      if (scene.formationId) {
        fieldEl.hidden = false
        fieldEl.appendChild(
          renderField({
            formationId: scene.formationId,
            compact: true,
            className: 'pcm-field-svg',
          }),
        )
      } else {
        fieldEl.hidden = true
      }
    }

    if (bodyEl) {
      bodyEl.classList.remove('pcm-body--in')
      bodyEl.innerHTML = scene.html
      if (animate) {
        requestAnimationFrame(() => bodyEl.classList.add('pcm-body--in'))
      } else {
        bodyEl.classList.add('pcm-body--in')
      }
    }
  }

  prevBtn?.addEventListener('click', () => {
    index = Math.max(0, index - 1)
    showScene(true)
  })
  nextBtn?.addEventListener('click', () => {
    if (index >= list.length - 1) return
    index += 1
    showScene(true)
  })
  root.querySelector(`#${uid}-restart`)?.addEventListener('click', () => {
    index = 0
    showScene(true)
  })

  showScene(false)
}

/**
 * Mount the three formation play-call movies (picker + active movie).
 * @param {HTMLElement} container
 * @returns {{ destroy: () => void }}
 */
export function mountPlayCallMovie(container) {
  let activeId = MOVIES[0].id
  /** @type {HTMLElement | null} */
  let playerRoot = null

  function renderHub() {
    container.innerHTML = `
      <div class="pcm-hub">
        <p class="pcm-hub-lead">Pick a formation — each movie starts with the call formula and the number slots to listen for.</p>
        <div class="pcm-movie-picker" role="tablist" aria-label="Formation movies">
          ${MOVIES.map(
            (m) => `
            <button type="button"
              class="pcm-movie-pick ${m.id === activeId ? 'active' : ''}"
              data-movie="${m.id}"
              role="tab"
              aria-selected="${m.id === activeId}">
              <span class="pcm-movie-pick-name">${m.shortLabel}</span>
              <span class="pcm-movie-pick-sub">How Play Calls Work</span>
            </button>`,
          ).join('')}
        </div>
        <h2 class="pcm-hub-title" id="pcm-hub-title"></h2>
        <div class="pcm-player-root" id="pcm-player-root"></div>
      </div>
    `

    container.querySelectorAll('[data-movie]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeId = btn.dataset.movie || MOVIES[0].id
        renderHub()
      })
    })

    const movie = MOVIES.find((m) => m.id === activeId) || MOVIES[0]
    const titleEl = container.querySelector('#pcm-hub-title')
    if (titleEl) titleEl.textContent = movie.label
    playerRoot = container.querySelector('#pcm-player-root')
    if (playerRoot) mountScenePlayer(playerRoot, movie.scenes(), movie.label)
  }

  renderHub()

  return {
    destroy() {
      container.innerHTML = ''
      playerRoot = null
    },
  }
}
