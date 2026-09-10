import { useEffect, useMemo, useState } from 'react'
import { symHTML, giftHTML, stickerHTML, giftsLoaded, onGiftsReady } from '../assets/loom'

type Kind = 'sym' | 'gift' | 'sticker'

/** Renders a verbatim crafted SVG object (glossy 3D symbol / gift / sticker). */
export function CraftedObject({ id, size = 120, kind = 'sym', className, style }: {
  id: string
  size?: number
  kind?: Kind
  className?: string
  style?: React.CSSProperties
}) {
  // The gift library is code-split; ask for it on first use and repaint when it lands.
  const [ready, setReady] = useState(() => kind !== 'gift' || giftsLoaded())
  useEffect(() => {
    if (kind !== 'gift' || ready) return
    return onGiftsReady(() => setReady(true))
  }, [kind, ready])

  const html = useMemo(() => {
    if (kind === 'gift') return ready ? giftHTML(id, size) : ''
    if (kind === 'sticker') return stickerHTML(id, size)
    return symHTML(id, size)
  }, [id, size, kind, ready])

  return (
    <span
      className={className}
      // the box is reserved either way, so a gift never reflows its card when it arrives
      style={{ display: 'inline-flex', width: size, height: size, lineHeight: 0, ...style }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
