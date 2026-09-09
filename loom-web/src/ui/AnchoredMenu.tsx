import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useDismiss } from './useDismiss'
import { useFocusTrap } from './useFocusTrap'

/**
 * A menu card pinned to a point on screen: flips and clamps so it never leaves the
 * viewport, closes on Esc / outside click / scroll underneath, and traps focus while open.
 */
export function AnchoredMenu({ at, label, onClose, children }: {
  at: { x: number; y: number }
  label: string
  onClose: () => void
  children: ReactNode
}) {
  const { closing, dismiss } = useDismiss(onClose)
  const boxRef = useRef<HTMLDivElement>(null)
  useFocusTrap(boxRef, !closing)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    // offsetWidth/Height, not getBoundingClientRect: the entrance animation scales the
    // box, and a mid-flight rect would place the menu over its own trigger.
    const width = el.offsetWidth
    const height = el.offsetHeight
    const M = 10
    let left = at.x
    let top = at.y
    if (left + width + M > window.innerWidth) left = at.x - width
    if (left < M) left = M
    if (top + height + M > window.innerHeight) top = at.y - height
    if (top < M) top = M
    setPos({ left, top })
  }, [at.x, at.y])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); dismiss() } }
    const onScroll = () => dismiss()
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [dismiss])

  return (
    <div className={`ctx-wrap ${closing ? 'out-scrim' : ''}`} onMouseDown={dismiss}
      onContextMenu={(e) => { e.preventDefault(); dismiss() }}>
      <div
        ref={boxRef}
        role="menu"
        aria-label={label}
        className={`ctx-anchor anim-menu ${closing ? 'out-menu' : ''}`}
        style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, opacity: 0, pointerEvents: 'none' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ctx-card">{children}</div>
      </div>
    </div>
  )
}
