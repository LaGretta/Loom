import { useMemo } from 'react'
import { useTheme } from '../store/theme'

// Living wallpaper layer — sits behind the message thread (§5). Never tints media.
export function Wallpaper() {
  const wp = useTheme((s) => s.wallpaper)
  const stars = useMemo(
    () => Array.from({ length: 46 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      size: 1.5 + Math.random() * 1.8,
    })),
    [],
  )

  if (wp === 'none') return null
  if (wp === 'aurora') {
    return (
      <div className="wp wp-aurora" aria-hidden>
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      </div>
    )
  }
  if (wp === 'shimmer') {
    return (
      <div className="wp wp-shimmer" aria-hidden>
        {stars.map((s, i) => (
          <span key={i} className="star" style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s`, width: s.size, height: s.size }} />
        ))}
      </div>
    )
  }
  if (wp === 'silk') return <div className="wp wp-silk" aria-hidden />
  if (wp === 'dither') return <div className="wp wp-dither" aria-hidden />
  return null
}
