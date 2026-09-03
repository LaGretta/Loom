import { initials, avatarGradient } from './format'

export function Avatar({ name, id, src, size = 48, online, dot, ring, style, className }: {
  name: string
  id?: number | string
  src?: string | null
  size?: number
  online?: boolean
  dot?: boolean
  ring?: boolean
  style?: React.CSSProperties
  className?: string
}) {
  const dotSize = Math.max(11, Math.round(size * 0.26))
  const fontSize = Math.round(size * 0.38)
  return (
    <span
      className={`avatar avatar-mono ${className ?? ''}`}
      style={{
        width: size, height: size, fontSize,
        background: src ? undefined : avatarGradient(id ?? name),
        boxShadow: ring ? '0 0 0 2px var(--accent)' : undefined,
        ...style,
      }}
    >
      {src ? <img src={src} alt={name} /> : initials(name)}
      {(dot ?? online) && (
        <span className="dot" style={{ width: dotSize, height: dotSize, background: online ? 'var(--green)' : 'var(--text-2)' }} />
      )}
    </span>
  )
}
