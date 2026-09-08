import { useEffect, useRef, useState } from 'react'
import { useChat } from '../store/chat'

/**
 * Subtle "connecting…" pill shown while the realtime hub is down (or the browser is
 * offline). Appears only after a short grace period so a blink never flashes it, and
 * confirms "back online" briefly before fading. On reconnect the data resyncs silently.
 */
const GRACE_MS = 900          // don't flash on a momentary drop
const OK_MS = 1600            // how long "back online" stays up

export function ConnectionStrip() {
  const hubConnected = useChat((s) => s.hubConnected)
  const resyncAll = useChat((s) => s.resyncAll)
  const [show, setShow] = useState(false)
  const [ok, setOk] = useState(false)
  const wasDown = useRef(false)

  // Treat "browser offline" the same as "hub down".
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  const down = !hubConnected || !online

  useEffect(() => {
    if (down) {
      setOk(false)
      const t = window.setTimeout(() => { setShow(true); wasDown.current = true }, GRACE_MS)
      return () => window.clearTimeout(t)
    }
    // came back up — resync quietly, then confirm and fade out
    if (wasDown.current) {
      wasDown.current = false
      void resyncAll()
      setOk(true)
      setShow(true)
      const t = window.setTimeout(() => setShow(false), OK_MS)
      return () => window.clearTimeout(t)
    }
    setShow(false)
    return
  }, [down, resyncAll])

  if (!show) return null
  return (
    <div className={`conn-strip ${ok ? 'ok' : ''}`} role="status" aria-live="polite">
      <span className="pulse" />
      {ok ? 'Back online' : online ? 'Connecting…' : 'No connection'}
    </div>
  )
}
