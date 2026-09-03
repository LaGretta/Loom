import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, X } from 'lucide-react'

/** Overlay screen: centered card on desktop, full-screen push on mobile. */
export function Overlay({ title, children, onClose, right, wide, noPad }: {
  title?: ReactNode
  children: ReactNode
  onClose?: () => void
  right?: ReactNode
  wide?: boolean
  noPad?: boolean
}) {
  const navigate = useNavigate()
  const close = onClose ?? (() => navigate(-1))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="scrim anim-scrim" onMouseDown={close} style={{ alignItems: 'stretch', justifyContent: 'center' }}>
      <div
        className="overlay-card anim-fade"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          width: wide ? 'min(760px,100vw)' : 'min(560px,100vw)',
          maxHeight: '100dvh',
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--hairline)',
          borderRight: '1px solid var(--hairline)',
          overflow: 'hidden',
        }}
      >
        <div className="frost" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--hairline)', position: 'sticky', top: 0, zIndex: 3 }}>
          <button className="icon-btn" onClick={close} aria-label="Back">
            <ChevronLeft size={22} className="mobile-only" />
            <X size={20} className="desktop-only" />
          </button>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.3px', flex: 1 }}>{title}</div>
          {right}
        </div>
        <div className="scroll-y" style={{ flex: 1, padding: noPad ? 0 : '4px 0 24px' }}>{children}</div>
      </div>
    </div>
  )
}
