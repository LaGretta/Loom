import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react'

export interface LightboxItem { id: number; url: string; caption?: string }

const MAX_ZOOM = 5
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/**
 * Fullscreen photo viewer: wheel/pinch zoom, drag to pan when zoomed, arrows or swipe
 * between every photo in the chat, download, Esc / tap-outside to close.
 */
export function Lightbox({ items, startId, onClose }: {
  items: LightboxItem[]
  startId: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(() => Math.max(0, items.findIndex((i) => i.id === startId)))
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const pinch = useRef<{ dist: number; zoom: number } | null>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)

  const cur = items[idx]

  const reset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])
  const go = useCallback((d: number) => {
    setIdx((i) => (i + d + items.length) % items.length)
    reset()
  }, [items.length, reset])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === '0') reset()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [go, onClose, reset])

  const onWheel = (e: React.WheelEvent) => {
    const next = clamp(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 1, MAX_ZOOM)
    setZoom(next)
    if (next === 1) setPan({ x: 0, y: 0 })
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom > 1) {
      drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
    } else {
      swipe.current = { x: e.clientX, y: e.clientY }
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    setPan({
      x: drag.current.px + (e.clientX - drag.current.x),
      y: drag.current.py + (e.clientY - drag.current.y),
    })
  }
  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null
    const s = swipe.current
    swipe.current = null
    if (!s || zoom > 1) return
    const dx = e.clientX - s.x
    if (Math.abs(dx) > 60 && Math.abs(e.clientY - s.y) < 80) go(dx < 0 ? 1 : -1)
  }

  // pinch to zoom
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const a = e.touches[0], b = e.touches[1]
      pinch.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom }
    }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      const a = e.touches[0], b = e.touches[1]
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      setZoom(clamp(pinch.current.zoom * (d / pinch.current.dist), 1, MAX_ZOOM))
    }
  }
  const onTouchEnd = () => { pinch.current = null }

  const download = () => {
    const a = document.createElement('a')
    a.href = cur.url
    a.download = cur.url.split('/').pop() || 'photo'
    a.target = '_blank'
    a.rel = 'noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  if (!cur) return null

  return (
    <div
      className="lightbox anim-scrim"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="lb-bar">
        <span className="lb-count">{items.length > 1 ? `${idx + 1} / ${items.length}` : ''}</span>
        <button className="icon-btn" onClick={download} aria-label="Download photo" title="Download">
          <Download size={20} />
        </button>
        <button className="icon-btn" onClick={onClose} aria-label="Close viewer" title="Close (Esc)">
          <X size={21} />
        </button>
      </div>

      {items.length > 1 && (
        <>
          <button className="lb-nav left" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft size={26} /></button>
          <button className="lb-nav right" onClick={() => go(1)} aria-label="Next photo"><ChevronRight size={26} /></button>
        </>
      )}

      <div
        className="lb-stage"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={() => (zoom > 1 ? reset() : setZoom(2))}
        onMouseDown={(e) => { if (e.target === e.currentTarget && zoom === 1) onClose() }}
      >
        <img
          className="lb-img anim-fade"
          src={cur.url}
          alt={cur.caption ?? 'Photo'}
          draggable={false}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? 'grab' : 'zoom-in',
          }}
        />
      </div>
    </div>
  )
}
