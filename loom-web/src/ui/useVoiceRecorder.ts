import { useCallback, useRef, useState } from 'react'

export type RecorderError = 'denied' | 'unsupported' | 'failed'

const MIME = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
const pickMime = () =>
  (typeof MediaRecorder !== 'undefined' && MIME.find((m) => MediaRecorder.isTypeSupported(m))) || ''

/**
 * Hold-to-record voice capture. Exposes elapsed seconds and a live 0..1 level so the
 * composer can show something honest while recording. Cancel discards the take.
 */
export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)

  const rec = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<number>()
  const raf = useRef<number>()
  const audioCtx = useRef<AudioContext | null>(null)
  const cancelled = useRef(false)
  const startedAt = useRef(0)

  const teardown = useCallback(() => {
    window.clearInterval(timer.current)
    if (raf.current) cancelAnimationFrame(raf.current)
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    void audioCtx.current?.close().catch(() => {})
    audioCtx.current = null
    rec.current = null
    setRecording(false)
    setLevel(0)
  }, [])

  const start = useCallback(async (): Promise<RecorderError | null> => {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return 'unsupported'
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = s
      cancelled.current = false
      chunks.current = []

      const mr = new MediaRecorder(s, pickMime() ? { mimeType: pickMime() } : undefined)
      rec.current = mr
      mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data) }
      mr.start(120)

      // live level meter
      const AC = window.AudioContext ?? (window as any).webkitAudioContext
      if (AC) {
        const ac: AudioContext = new AC()
        audioCtx.current = ac
        const src = ac.createMediaStreamSource(s)
        const an = ac.createAnalyser()
        an.fftSize = 256
        src.connect(an)
        const buf = new Uint8Array(an.frequencyBinCount)
        const tick = () => {
          an.getByteTimeDomainData(buf)
          let peak = 0
          for (const v of buf) peak = Math.max(peak, Math.abs(v - 128) / 128)
          setLevel(peak)
          raf.current = requestAnimationFrame(tick)
        }
        tick()
      }

      startedAt.current = Date.now()
      setSeconds(0)
      timer.current = window.setInterval(
        () => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 200)
      setRecording(true)
      return null
    } catch (e: any) {
      teardown()
      return e?.name === 'NotAllowedError' || e?.name === 'SecurityError' ? 'denied' : 'failed'
    }
  }, [teardown])

  /** Stop and resolve the take (null when cancelled or empty). */
  const stop = useCallback(async (): Promise<{ blob: Blob; seconds: number } | null> => {
    const mr = rec.current
    if (!mr) { teardown(); return null }
    const secs = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000))
    const done = new Promise<Blob | null>((resolve) => {
      mr.onstop = () => resolve(cancelled.current || !chunks.current.length
        ? null
        : new Blob(chunks.current, { type: chunks.current[0]?.type || 'audio/webm' }))
    })
    try { mr.stop() } catch { /* already stopped */ }
    const blob = await done
    teardown()
    return blob ? { blob, seconds: secs } : null
  }, [teardown])

  const cancel = useCallback(async () => { cancelled.current = true; await stop() }, [stop])

  return { recording, seconds, level, start, stop, cancel }
}
