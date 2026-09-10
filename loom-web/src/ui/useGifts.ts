import { useEffect, useState } from 'react'
import { giftsLoaded, onGiftsReady } from '../assets/loom'

/**
 * The gift SVG library is code-split. Any screen that resolves gift metadata during
 * render has to repaint once it lands, or it keeps showing the fallback for good.
 */
export function useGiftsReady(enabled = true): boolean {
  const [ready, setReady] = useState(giftsLoaded)
  useEffect(() => {
    if (!enabled || ready) return
    return onGiftsReady(() => setReady(true))
  }, [enabled, ready])
  return ready
}
