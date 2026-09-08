/* Content-shaped loading placeholders (§Phase 2). Never a bare spinner: each skeleton
   mirrors the real row/card geometry so nothing shifts when data lands. */

/** One shimmering block. */
export function Skel({ w, h = 12, r = 8, style }: {
  w?: number | string; h?: number | string; r?: number; style?: React.CSSProperties
}) {
  return <span className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />
}

/** Chat-list rows: 48px avatar + name/time + preview/badge — matches .chat-row exactly. */
export function ChatListSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="chat-row" style={{ cursor: 'default' }}>
          <Skel w={48} h={48} r={999} />
          <div className="col">
            <div className="r1"><Skel w={`${45 + ((i * 13) % 30)}%`} h={13} /><Skel w={30} h={10} style={{ marginLeft: 'auto' }} /></div>
            <div className="r2"><Skel w={`${55 + ((i * 17) % 30)}%`} h={11} /></div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Alternating in/out bubbles of varied width. */
export function ThreadSkeleton({ rows = 6 }: { rows?: number }) {
  const widths = [58, 38, 72, 46, 64, 34]
  return (
    <div aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`msg-row ${i % 2 ? 'out' : ''}`}>
          <Skel w={`${widths[i % widths.length]}%`} h={i % 3 === 0 ? 52 : 34} r={18} />
        </div>
      ))}
    </div>
  )
}

/** Contact rows: 46px avatar + two lines. */
export function ContactsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="chat-row" style={{ cursor: 'default' }}>
          <Skel w={46} h={46} r={999} />
          <div className="col">
            <div className="r1"><Skel w={`${40 + ((i * 11) % 28)}%`} h={13} /></div>
            <div className="r2"><Skel w={`${28 + ((i * 7) % 20)}%`} h={11} /></div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Gift catalog grid: art area + title/price line. */
export function GiftsSkeleton({ cells = 6 }: { cells?: number }) {
  return (
    <div aria-hidden style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
      {Array.from({ length: cells }).map((_, i) => (
        <div key={i} style={{ border: '1px solid var(--hairline)', borderRadius: 16, overflow: 'hidden' }}>
          <Skel w="100%" h={130} r={0} />
          <div style={{ padding: '8px 10px' }}>
            <Skel w="70%" h={13} />
            <div style={{ height: 6 }} />
            <Skel w="40%" h={11} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Calendar: a few event cards. */
export function CalendarSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, border: '1px solid var(--hairline)', borderRadius: 16 }}>
          <Skel w={48} h={48} r={13} />
          <div style={{ flex: 1 }}>
            <Skel w={`${50 + ((i * 13) % 25)}%`} h={13} />
            <div style={{ height: 6 }} />
            <Skel w="35%" h={11} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Profile: avatar + name + a couple of rows. */
export function ProfileSkeleton() {
  return (
    <div aria-hidden style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '18px 0 22px' }}>
        <Skel w={96} h={96} r={999} />
        <Skel w={160} h={16} />
        <Skel w={110} h={12} />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px' }}>
          <Skel w={34} h={34} r={10} />
          <Skel w={`${40 + ((i * 15) % 30)}%`} h={13} />
        </div>
      ))}
    </div>
  )
}
