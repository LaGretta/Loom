import { symHTML, giftHTML } from '../assets/loom'

const reduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * A short, self-removing confirmation burst (crafted object + expanding ring + label).
 * Purely presentational: mounts, plays for ~600ms, cleans itself up.
 */
export function celebrate(sym: string, text?: string) {
  if (typeof document === 'undefined' || reduced()) return
  const host = document.createElement('div')
  host.className = 'celebrate'
  host.setAttribute('aria-hidden', 'true')
  host.innerHTML = `<span class="cb-ring"></span><span class="cb-obj">${symHTML(sym, 96)}</span>${
    text ? `<span class="cb-text">${text}</span>` : ''}`
  document.body.appendChild(host)
  window.setTimeout(() => host.remove(), 900)
}

/**
 * Sends a gift object flying from `fromEl` toward the conversation (or screen centre-bottom),
 * so the purchase visibly "goes" somewhere instead of a modal just closing.
 */
export function flyGift(fromEl: HTMLElement | null, giftSym: string) {
  if (typeof document === 'undefined' || reduced() || !fromEl) return
  const r = fromEl.getBoundingClientRect()
  const target = document.querySelector('.composer-dock') ?? document.querySelector('.thread')
  const t = target?.getBoundingClientRect()
  const toX = t ? t.left + t.width / 2 : window.innerWidth / 2
  const toY = t ? t.top + t.height / 2 : window.innerHeight - 90

  const el = document.createElement('div')
  el.className = 'gift-fly'
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = giftHTML(giftSym, 92)
  el.style.left = `${r.left + r.width / 2}px`
  el.style.top = `${r.top + r.height / 2}px`
  document.body.appendChild(el)

  const anim = el.animate(
    [
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${(toX - (r.left + r.width / 2)) * 0.55}px), calc(-50% + ${(toY - (r.top + r.height / 2)) * 0.45}px)) scale(.8)`, opacity: 1, offset: 0.55 },
      { transform: `translate(calc(-50% + ${toX - (r.left + r.width / 2)}px), calc(-50% + ${toY - (r.top + r.height / 2)}px)) scale(.32)`, opacity: 0 },
    ],
    { duration: 560, easing: 'cubic-bezier(.4,0,.2,1)' },
  )
  const done = () => el.remove()
  anim.onfinish = done
  anim.oncancel = done
  // Guaranteed cleanup: if the animation never fires (hidden tab, throttled engine,
  // interrupted navigation) the fixed node would otherwise linger on screen forever.
  window.setTimeout(done, 900)
}
