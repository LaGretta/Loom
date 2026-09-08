import { useCallback, useEffect, useRef, useState } from 'react'

const reduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Keeps an overlay mounted just long enough to play its exit animation.
 * `dismiss()` starts the exit; `closing` drives the .out-* class. Under
 * prefers-reduced-motion the close is immediate.
 */
export function useDismiss(onClose: () => void, ms = 160) {
  const [closing, setClosing] = useState(false)
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const dismiss = useCallback(() => {
    if (closing) return
    if (reduced()) { onClose(); return }
    setClosing(true)
    timer.current = window.setTimeout(onClose, ms)
  }, [closing, onClose, ms])

  return { closing, dismiss }
}
