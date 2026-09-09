import { useEffect, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

/** Only one voice note plays at a time. */
let current: HTMLAudioElement | null = null

const mmss = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/** Decorative but stable bar heights, derived from the URL so a note always looks the same. */
function bars(seed: string, n = 34): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return Array.from({ length: n }, (_, i) => {
    h = (h * 1103515245 + 12345 + i) >>> 0
    return 0.25 + ((h >>> 8) % 1000) / 1000 * 0.75
  })
}

export function VoiceBubble({ src, seconds, mine }: { src: string; seconds?: number; mine: boolean }) {
  const ref = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [dur, setDur] = useState(seconds ?? 0)
  const [pos, setPos] = useState(0)
  const peaks = useRef(bars(src)).current

  useEffect(() => () => { if (current === ref.current) current = null; ref.current?.pause() }, [])

  const toggle = () => {
    const el = ref.current
    if (!el) return
    if (playing) { el.pause(); return }
    if (current && current !== el) { current.pause() }
    current = el
    void el.play().catch(() => setPlaying(false))
  }

  const scrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || !Number.isFinite(el.duration)) return
    const r = e.currentTarget.getBoundingClientRect()
    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    el.currentTime = p * el.duration
    setPos(p)
  }

  const progress = dur > 0 ? Math.min(1, pos) : 0

  return (
    <div className={`voice ${mine ? 'out' : ''}`}>
      <button className="voice-play" onClick={toggle} aria-label={playing ? 'Pause voice message' : 'Play voice message'}>
        {playing ? <Pause size={17} /> : <Play size={17} style={{ marginLeft: 2 }} />}
      </button>

      <div className="voice-body">
        <div className="voice-wave" onClick={scrub} role="slider"
          aria-label="Seek" aria-valuemin={0} aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)} tabIndex={0}>
          {peaks.map((h, i) => (
            <span key={i} className={`vb ${i / peaks.length <= progress ? 'on' : ''}`} style={{ height: `${h * 100}%` }} />
          ))}
        </div>
        <div className="voice-time">{mmss(playing || pos > 0 ? progress * dur : dur)}</div>
      </div>

      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = (e.currentTarget as HTMLAudioElement).duration
          if (Number.isFinite(d) && d > 0) setDur(d)
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setPos(0) }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget as HTMLAudioElement
          if (Number.isFinite(el.duration) && el.duration > 0) setPos(el.currentTime / el.duration)
        }}
      />
    </div>
  )
}
