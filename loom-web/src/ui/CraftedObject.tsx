import { useMemo } from 'react'
import { symHTML, giftHTML, stickerHTML } from '../assets/loom'

type Kind = 'sym' | 'gift' | 'sticker'

/** Renders a verbatim crafted SVG object (glossy 3D symbol / gift / sticker). */
export function CraftedObject({ id, size = 120, kind = 'sym', className, style }: {
  id: string
  size?: number
  kind?: Kind
  className?: string
  style?: React.CSSProperties
}) {
  const html = useMemo(() => {
    if (kind === 'gift') return giftHTML(id, size)
    if (kind === 'sticker') return stickerHTML(id, size)
    return symHTML(id, size)
  }, [id, size, kind])

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', width: size, height: size, lineHeight: 0, ...style }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
