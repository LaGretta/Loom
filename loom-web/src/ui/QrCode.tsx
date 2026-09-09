import { useMemo } from 'react'
import { qrMatrix } from './qr'

/**
 * A scannable QR code. Always dark-on-white with a real quiet zone, in both themes —
 * a themed (inverted or tinted) code is a code most phone cameras refuse to read.
 */
export function QrCode({ text, size = 200, quiet = 4 }: { text: string; size?: number; quiet?: number }) {
  const modules = useMemo(() => {
    try { return qrMatrix(text) } catch { return null }
  }, [text])

  if (!modules) return null

  const n = modules.length
  const side = n + quiet * 2
  // one path for every dark module keeps the DOM to a single node
  let d = ''
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules[r][c]) d += `M${c + quiet} ${r + quiet}h1v1h-1z`
    }
  }

  return (
    <svg
      className="qr"
      width={size}
      height={size}
      viewBox={`0 0 ${side} ${side}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR code for the invite link"
    >
      <rect width={side} height={side} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  )
}
