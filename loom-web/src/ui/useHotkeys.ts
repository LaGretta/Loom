import { useEffect } from 'react'
import { useNav } from '../store/nav'

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

/** App-wide shortcuts: Cmd/Ctrl+K opens message search, "/" focuses the composer. */
export function useHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        // Cmd/Ctrl+K is message search now — the chat-list field only filters the list.
        e.preventDefault()
        useNav.getState().openSearch()
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
