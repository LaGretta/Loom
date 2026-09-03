import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

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

export function EmptyState({ icon, title, subtitle }: { icon?: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="empty">
      {icon}
      <div className="et">{title}</div>
      {subtitle && <div>{subtitle}</div>}
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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="scrim anim-scrim" onMouseDown={onClose}>
      <div className="modal-card anim-menu" style={wide ? { width: 'min(680px,calc(100vw - 32px))' } : undefined} onMouseDown={(e) => e.stopPropagation()}>
        {title !== undefined && (
          <div className="modal-head">
            <div className="mt">{title}</div>
            <button className="icon-btn" onClick={onClose}><X size={20} /></button>
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
  return (
    <div className="scrim bottom anim-scrim" onMouseDown={onClose}>
      <div className="sheet anim-sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="grab" />
        {children}
      </div>
    </div>
  )
}
