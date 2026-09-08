import { useEffect, useRef, type ReactNode } from 'react'
import { useDismiss } from './useDismiss'
import { useFocusTrap } from './useFocusTrap'
import { X, AlertTriangle, RotateCw } from 'lucide-react'

export function Spinner() { return <span className="spinner" /> }
export function CenterSpinner() { return <div className="center-fill"><Spinner /></div> }

export function Button({ variant = 'primary', block, className = '', children, ...rest }: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  block?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`btn btn-${variant} ${block ? 'btn-block' : ''} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function IconButton({ children, active, className = '', ...rest }: {
  active?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`icon-btn ${active ? 'accent' : ''} ${className}`} {...rest}>{children}</button>
  )
}

export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span className="knob" />
    </button>
  )
}

export function EmptyState({ icon, title, subtitle, action }: {
  icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode
}) {
  return (
    <div className="empty">
      {icon}
      <div className="et">{title}</div>
      {subtitle && <div>{subtitle}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  )
}

/** Recoverable failure: say what broke and offer a way out. Never a blank surface. */
export function ErrorState({ title = "Couldn't load", subtitle, onRetry, retryLabel = 'Retry' }: {
  title?: string; subtitle?: string; onRetry: () => void; retryLabel?: string
}) {
  return (
    <div className="err-state">
      <AlertTriangle size={30} strokeWidth={1.6} color="var(--danger)" />
      <div className="es-t">{title}</div>
      {subtitle && <div className="es-s">{subtitle}</div>}
      <Button variant="secondary" onClick={onRetry} style={{ marginTop: 4 }}>
        <RotateCw size={16} /> {retryLabel}
      </Button>
    </div>
  )
}

/** Centered modal card overlay. */
export function Modal({ title, onClose, children, footer, wide }: {
  title?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const { closing, dismiss } = useDismiss(onClose)
  const cardRef = useRef<HTMLDivElement>(null)
  useFocusTrap(cardRef, !closing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss])
  return (
    <div className={`scrim anim-scrim ${closing ? 'out-scrim' : ''}`} onMouseDown={dismiss}>
      <div ref={cardRef} role="dialog" aria-modal="true" className={`modal-card anim-menu ${closing ? 'out-menu' : ''}`} style={wide ? { width: 'min(680px,calc(100vw - 32px))' } : undefined} onMouseDown={(e) => e.stopPropagation()}>
        {title !== undefined && (
          <div className="modal-head">
            <div className="mt">{title}</div>
            <button className="icon-btn" onClick={dismiss}><X size={20} /></button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

/** Bottom sheet. */
export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const { closing, dismiss } = useDismiss(onClose, 200)
  const sheetRef = useRef<HTMLDivElement>(null)
  useFocusTrap(sheetRef, !closing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss])
  return (
    <div className={`scrim bottom anim-scrim ${closing ? 'out-scrim' : ''}`} onMouseDown={dismiss}>
      <div ref={sheetRef} role="dialog" aria-modal="true" className={`sheet anim-sheet ${closing ? 'out-sheet' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="grab" />
        {children}
      </div>
    </div>
  )
}
