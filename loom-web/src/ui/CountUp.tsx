import { useEffect, useRef, useState } from 'react'
import { fmtNumber } from './format'

const reduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Star balance that rolls to its new value and briefly highlights the direction. */
export function CountUp({ value, className = '', style }: {
  value: number; className?: string; style?: React.CSSProperties
}) {
  const [display, setDisplay] = useState(value)
  const [dir, setDir] = useState<'' | 'up' | 'down'>('')
  const from = useRef(value)
  const raf = useRef<number>()

  useEffect(() => {
    const a = from.current
    const b = value
    if (a === b) return
    from.current = b
    setDir(b > a ? 'up' : 'down')
    if (reduced()) { setDisplay(b); window.setTimeout(() => setDir(''), 260); return }

    const D = 450, t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / D)
      const e = 1 - Math.pow(1 - p, 3)                 // easeOutCubic
      setDisplay(Math.round(a + (b - a) * e))
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else { setDisplay(b); window.setTimeout(() => setDir(''), 300) }
    }
    raf.current = requestAnimationFrame(tick)
    // rAF is throttled in background/hidden tabs — without this the counter could be
    // left showing a stale balance, which is worse than skipping the animation.
    const settle = window.setTimeout(() => { setDisplay(b); setDir('') }, D + 120)
    return () => { if (raf.current) cancelAnimationFrame(raf.current); window.clearTimeout(settle) }
  }, [value])

  return <span className={`countup ${dir} ${className}`} style={style}>{fmtNumber(display)}</span>
}
