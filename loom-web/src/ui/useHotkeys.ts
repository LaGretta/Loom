import { useEffect } from 'react'

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

const focusFirstVisible = (selector: string) => {
  const el = Array.from(document.querySelectorAll<HTMLElement>(selector)).find((n) => n.offsetParent !== null)
  if (el) { el.focus(); return true }
  return false
}

/** App-wide shortcuts: Cmd/Ctrl+K jumps to search, "/" focuses the composer. */
export function useHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (focusFirstVisible('[data-search-input]')) e.preventDefault()
        return
      }
      // "/" is only a shortcut when you're not already typing somewhere
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target)) {
        if (focusFirstVisible('[data-composer]')) e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
