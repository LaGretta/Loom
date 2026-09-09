/* In-app notification effects: sound, tab title, favicon badge, Notification API.
   No backend involvement — real push (app fully closed) needs Web Push + VAPID. */

const BASE_TITLE = 'Loom'
const PING_GAP_MS = 2500          // rate limit: never machine-gun on a burst

/* ---------------- sound ---------------- */
let audio: AudioContext | null = null
let lastPing = 0

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext ?? (window as any).webkitAudioContext
  if (!AC) return null
  if (!audio) audio = new AC()
  if (audio.state === 'suspended') void audio.resume()
  return audio
}

/** Unlock WebAudio on the first user gesture (browsers block audio before one). */
export function primeAudio() {
  const once = () => { ctx(); window.removeEventListener('pointerdown', once); window.removeEventListener('keydown', once) }
  window.addEventListener('pointerdown', once, { once: true })
  window.addEventListener('keydown', once, { once: true })
}

/** Short two-note ping, synthesised so there's no asset to ship. Rate-limited. */
export function playPing() {
  const now = Date.now()
  if (now - lastPing < PING_GAP_MS) return
  const ac = ctx()
  if (!ac || ac.state !== 'running') return
  lastPing = now

  const gain = ac.createGain()
  gain.connect(ac.destination)
  gain.gain.setValueAtTime(0.0001, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.14, ac.currentTime + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.34)

  const notes = [880, 1174.7]     // A5 -> D6, a gentle rising blip
  notes.forEach((f, i) => {
    const o = ac.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(f, ac.currentTime + i * 0.09)
    o.connect(gain)
    o.start(ac.currentTime + i * 0.09)
    o.stop(ac.currentTime + i * 0.09 + 0.16)
  })
}

/* ---------------- tab title ---------------- */
let blink: number | undefined

export function setTitleBadge(unread: number, alternate?: string | null) {
  if (typeof document === 'undefined') return
  window.clearInterval(blink)
  if (unread <= 0) { document.title = BASE_TITLE; return }
  const counted = `(${unread}) ${BASE_TITLE}`
  document.title = counted
  // Only alternate while the tab is in the background — flashing a focused tab is noise.
  if (!alternate || !document.hidden) return
  let flip = false
  blink = window.setInterval(() => {
    flip = !flip
    document.title = flip ? alternate : counted
  }, 1600)
}

/* ---------------- favicon badge ---------------- */
let baseIcon: HTMLImageElement | null = null
let baseReady = false

function ensureBase() {
  if (baseIcon || typeof Image === 'undefined') return
  baseIcon = new Image()
  baseIcon.onload = () => { baseReady = true }
  baseIcon.onerror = () => { baseReady = false }
  baseIcon.src = '/favicon.svg'
}

function linkEl(): HTMLLinkElement {
  let l = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l) }
  return l
}

let originalHref: string | null = null

export function setFaviconBadge(count: number) {
  if (typeof document === 'undefined') return
  const link = linkEl()
  if (originalHref === null) originalHref = link.getAttribute('href')
  if (count <= 0) { if (originalHref) link.href = originalHref; return }

  ensureBase()
  const size = 64
  const c = document.createElement('canvas')
  c.width = size; c.height = size
  const g = c.getContext('2d')
  if (!g) return

  try {
    if (baseReady && baseIcon) g.drawImage(baseIcon, 0, 0, size, size)
    else { g.fillStyle = '#0A0A0B'; g.beginPath(); g.roundRect(2, 2, size - 4, size - 4, 14); g.fill()
           g.fillStyle = '#fff'; g.font = 'bold 34px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('L', size / 2, size / 2 + 2) }

    // badge
    const r = 21
    g.beginPath(); g.arc(size - r - 1, r + 1, r, 0, Math.PI * 2)
    g.fillStyle = '#E4404F'; g.fill()
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.stroke()
    g.fillStyle = '#fff'
    const label = count > 9 ? '9+' : String(count)
    g.font = `bold ${count > 9 ? 24 : 30}px system-ui`
    g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(label, size - r - 1, r + 3)

    link.href = c.toDataURL('image/png')
  } catch { /* tainted canvas / no roundRect — keep the existing icon */ }
}

/* ---------------- Notification API ---------------- */
type ClickHandler = (chatId: number) => void
let onClick: ClickHandler = () => {}
export function setNotificationClickHandler(fn: ClickHandler) { onClick = fn }

export function notificationsSupported() { return typeof Notification !== 'undefined' }

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try { return await Notification.requestPermission() } catch { return Notification.permission }
}

export function showMessageNotification(opts: { title: string; body: string; chatId: number; tag?: string }) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      icon: '/favicon.svg',
      tag: opts.tag ?? `loom-chat-${opts.chatId}`,   // collapse repeats per chat
      silent: true,                                  // we play our own ping
    })
    n.onclick = () => { window.focus(); onClick(opts.chatId); n.close() }
  } catch { /* some engines throw when constructing without a SW */ }
}
