/* TEMPORARY audit helpers — deleted after the sweep. */
const parseColor = (c: string): [number, number, number, number] => {
  if (!c) return [0, 0, 0, 0]
  if (c.startsWith('color(')) {
    const n = (c.match(/-?\d*\.?\d+/g) || []).map(Number)
    return [n[0] * 255, n[1] * 255, n[2] * 255, n[3] ?? 1]
  }
  const n = (c.match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number)
  return [n[0] || 0, n[1] || 0, n[2] || 0, n[3] ?? 1]
}
const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
const lum = (c: [number, number, number, number]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
const over = (fg: [number, number, number, number], bg: [number, number, number, number]) => {
  const a = fg[3]
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1] as [number, number, number, number]
}
export const contrast = (fg: string, bg: string) => {
  const f = parseColor(fg), b = parseColor(bg)
  const solid = f[3] < 1 ? over(f, b) : f
  const [x, y] = [lum(solid), lum(b)].sort((p, q) => q - p)
  return +((x + 0.05) / (y + 0.05)).toFixed(2)
}
/** Walk up until an opaque background is found; composite anything translucent on the way. */
export function effectiveBg(el: Element): string {
  let node: Element | null = el
  const stack: [number, number, number, number][] = []
  while (node) {
    const c = parseColor(getComputedStyle(node).backgroundColor)
    if (c[3] > 0) { stack.push(c); if (c[3] >= 1) break }
    node = node.parentElement
  }
  if (!stack.length) return 'rgb(255,255,255)'
  let acc = stack[stack.length - 1]
  for (let i = stack.length - 2; i >= 0; i--) acc = over(stack[i], acc)
  return `rgb(${acc[0]},${acc[1]},${acc[2]})`
}

export interface Finding { kind: string; detail: string; sel: string }

/** A gradient or image behind the text makes the ratio uncomputable from backgroundColor. */
function hasImageBg(el: Element): boolean {
  let node: Element | null = el
  while (node) {
    const cs = getComputedStyle(node)
    if (cs.backgroundImage && cs.backgroundImage !== 'none') return true
    if (parseColorAlpha(cs.backgroundColor) >= 1) return false
    node = node.parentElement
  }
  return false
}
const parseColorAlpha = (c: string) => {
  const n = (c.match(/-?\d*\.?\d+/g) || []).map(Number)
  return c.startsWith('color(') ? (n[3] ?? 1) : (n[3] ?? 1)
}

const label = (el: Element) => {
  const cls = (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')
  return el.tagName.toLowerCase() + cls
}
const visible = (el: Element) => {
  const cs = getComputedStyle(el)
  if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

/** Text nodes whose contrast against their effective background is below the WCAG AA bar. */
export function auditContrast(root: ParentNode = document): Finding[] {
  const out: Finding[] = []
  const seen = new Set<Element>()
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
    if (seen.has(el) || !visible(el)) continue
    const direct = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent || '').trim().length > 1)
    if (!direct) continue
    seen.add(el)
    if (hasImageBg(el)) continue
    // Colour-emoji glyphs are painted by the font and ignore `color` entirely.
    const txt = (el.textContent || '').trim()
    if (txt && !/[\p{L}\p{N}]/u.test(txt)) continue
    const cs = getComputedStyle(el)
    const size = parseFloat(cs.fontSize)
    const weight = Number(cs.fontWeight) || 400
    const large = size >= 24 || (size >= 18.66 && weight >= 700)
    const need = large ? 3 : 4.5
    const ratio = contrast(cs.color, effectiveBg(el))
    if (ratio < need) {
      out.push({ kind: 'contrast', sel: label(el), detail: `${ratio}:1 (needs ${need}) — "${(el.textContent || '').trim().slice(0, 34)}" ${Math.round(size)}px/${weight}` })
    }
  }
  return out
}

/** Anything painting outside the viewport horizontally, or clipped inside its own box. */
export function auditOverflow(): Finding[] {
  const out: Finding[] = []
  const de = document.documentElement
  if (de.scrollWidth > window.innerWidth + 1) out.push({ kind: 'page-overflow-x', sel: 'html', detail: `${de.scrollWidth} > ${window.innerWidth}` })
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
    if (!visible(el)) continue
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) continue
    if (r.right > window.innerWidth + 1 || r.left < -1) {
      const cs = getComputedStyle(el)
      if (cs.position === 'fixed' || cs.position === 'absolute') continue
      out.push({ kind: 'off-viewport', sel: label(el), detail: `left=${Math.round(r.left)} right=${Math.round(r.right)} vw=${window.innerWidth}` })
    }
  }
  return out
}

/** Text clipped because its box is too small (ellipsis is fine, silent cropping is not). */
export function auditClipped(): Finding[] {
  const out: Finding[] = []
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
    if (!visible(el)) continue
    const cs = getComputedStyle(el)
    const hidden = cs.overflow === 'hidden' || cs.overflowY === 'hidden'
    if (!hidden) continue
    if (el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0 && cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') {
      const t = (el.textContent || '').trim()
      if (t.length > 1) out.push({ kind: 'clipped-y', sel: label(el), detail: `${el.scrollHeight} > ${el.clientHeight} — "${t.slice(0, 30)}"` })
    }
  }
  return out
}

/** Interactive targets smaller than a comfortable tap size. */
export function auditHitAreas(min = 32): Finding[] {
  const out: Finding[] = []
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('button,a[href],[role="button"],input[type=checkbox]'))) {
    if (!visible(el)) continue
    const r = el.getBoundingClientRect()
    if (r.width < min || r.height < min) out.push({ kind: 'small-target', sel: label(el), detail: `${Math.round(r.width)}x${Math.round(r.height)} — "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24)}"` })
  }
  return out
}

/** Buttons with no accessible name at all. */
export function auditA11yNames(): Finding[] {
  const out: Finding[] = []
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('button,a[href]'))) {
    if (!visible(el)) continue
    const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim()
    if (!name) out.push({ kind: 'no-name', sel: label(el), detail: el.outerHTML.slice(0, 70) })
  }
  return out
}

export function auditAll() {
  return [...auditContrast(), ...auditOverflow(), ...auditClipped(), ...auditA11yNames()]
}

const THEMES = ['mono', 'ink', 'steel', 'moss', 'amber'] as const
const MODES = ['light', 'dark'] as const

/** Run every audit across all palettes; contrast is per-theme, geometry only needs one pass. */
export function sweepThemes(): Record<string, Finding[]> {
  const html = document.documentElement
  const theme0 = html.getAttribute('data-theme'), mode0 = html.getAttribute('data-mode')
  const out: Record<string, Finding[]> = {}
  const geo = [...auditOverflow(), ...auditClipped(), ...auditA11yNames()]
  if (geo.length) out.geometry = geo
  // Switching data-mode starts a `transition: color` on rows/buttons. Reading mid-flight
  // (or in a throttled tab where it never advances) reports the OLD theme's colour.
  const freeze = document.createElement('style')
  freeze.textContent = '*,*::before,*::after{transition:none !important;animation:none !important}'
  document.head.appendChild(freeze)
  try {
    for (const t of THEMES) for (const m of MODES) {
      html.setAttribute('data-theme', t); html.setAttribute('data-mode', m)
      void getComputedStyle(html).backgroundColor
      const f = auditContrast()
      if (f.length) out[`${t}/${m}`] = f
    }
  } finally {
    freeze.remove()
    if (theme0) html.setAttribute('data-theme', theme0)
    if (mode0) html.setAttribute('data-mode', mode0)
  }
  return out
}

/** Collapse per-theme contrast findings into one row per element, worst ratio first. */
export function summarise(res: Record<string, Finding[]>) {
  const byEl = new Map<string, { sel: string; detail: string; worst: number; themes: string[] }>()
  const other: Finding[] = []
  for (const [k, list] of Object.entries(res)) {
    if (k === 'geometry') { other.push(...list); continue }
    for (const f of list) {
      const ratio = parseFloat(f.detail)
      const key = f.sel + '|' + f.detail.split('—')[1]
      const hit = byEl.get(key)
      if (hit) { hit.themes.push(k); hit.worst = Math.min(hit.worst, ratio) }
      else byEl.set(key, { sel: f.sel, detail: f.detail, worst: ratio, themes: [k] })
    }
  }
  return {
    contrast: [...byEl.values()].sort((a, b) => a.worst - b.worst)
      .map((v) => `${v.worst}:1 ${v.sel} ${v.detail.replace(/^[\d.]+:1 \([^)]*\) /, '')} [${v.themes.length === 10 ? 'ALL' : v.themes.join(',')}]`),
    other: other.map((f) => `${f.kind} ${f.sel} ${f.detail}`),
  }
}

const SWEEP_KEY = 'loom.sweep'

/** Walks a route list across page reloads, auditing each one, then parks the results. */
export function autoSweep(routes: string[], settleMs = 1400) {
  const raw = sessionStorage.getItem(SWEEP_KEY)
  if (!raw) return
  const st = JSON.parse(raw) as { i: number; done?: boolean; results: Record<string, unknown> }
  if (st.done) return
  window.setTimeout(() => {
    const route = routes[st.i]
    try { st.results[route] = summarise(sweepThemes()) }
    catch (e) { st.results[route] = { crashed: String(e) } }
    st.i += 1
    if (st.i >= routes.length) st.done = true
    sessionStorage.setItem(SWEEP_KEY, JSON.stringify(st))
    if (!st.done) { location.hash = routes[st.i]; location.reload() }
  }, settleMs)
}
