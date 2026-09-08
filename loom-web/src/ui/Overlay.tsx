import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, X } from 'lucide-react'
import { useDismiss } from './useDismiss'

/**
 * Overlay screen. Mobile: full-screen push (unchanged). Desktop: a centred island panel
 * over a blurred, dimmed backdrop — whatever is behind (a conversation, a pane) stays
 * mounted and visible, so closing returns to it exactly as it was.
 */
export function Overlay({ title, children, onClose, right, wide, noPad, floating }: {
  title?: ReactNode
  children: ReactNode
  onClose?: () => void
  right?: ReactNode
  wide?: boolean
  noPad?: boolean
  /** float as an island over a blurred backdrop on EVERY size (not just desktop) */
  floating?: boolean
}) {
  const navigate = useNavigate()
  const close = onClose ?? (() => navigate(-1))
  const { closing, dismiss } = useDismiss(close)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss])

  return (
    <div className={`scrim ov-scrim anim-scrim ${floating ? 'ov-floating' : ''} ${closing ? 'out-scrim' : ''}`} onMouseDown={dismiss}>
      <div
        className={`overlay-card anim-fade ${wide ? 'ov-wide' : ''} ${closing ? 'out-fade' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="ov-head frost">
          <button className="icon-btn" onClick={dismiss} aria-label="Back">
            <ChevronLeft size={22} className="mobile-only" />
            <X size={20} className="desktop-only" />
          </button>
          <div className="ov-title">{title}</div>
          {right}
        </div>
        <div className={`ov-body scroll-y ${noPad ? 'nopad' : ''}`}>{children}</div>
      </div>
    </div>
  )
}
