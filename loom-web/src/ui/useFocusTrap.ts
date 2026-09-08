import { useEffect, type RefObject } from 'react'

const SEL = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Keeps Tab focus inside an open dialog and restores it to the trigger on close.
 * Without this, tabbing out of a modal lands on the page behind it — a classic trap
 * in reverse: the user can't tell where focus went.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return
    const restoreTo = document.activeElement as HTMLElement | null

    const items = () => Array.from(el.querySelectorAll<HTMLElement>(SEL)).filter((n) => n.offsetParent !== null)
    const first = items()[0]
    if (first) first.focus()
    else { el.setAttribute('tabindex', '-1'); el.focus() }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const list = items()
      if (!list.length) { e.preventDefault(); return }
      const i = list.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && i <= 0) { e.preventDefault(); list[list.length - 1].focus() }
      else if (!e.shiftKey && i === list.length - 1) { e.preventDefault(); list[0].focus() }
    }
    el.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('keydown', onKey)
      // give the closing animation a frame, then hand focus back to whatever opened us
      if (restoreTo && document.contains(restoreTo)) restoreTo.focus()
    }
  }, [ref, active])
}
