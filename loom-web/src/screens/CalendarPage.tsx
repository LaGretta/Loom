import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react'
import { eventsApi } from '../lib/api'
import { CenterSpinner } from '../ui/primitives'
import { CreateEventModal } from '../components/CreateEventModal'
import type { LoomEvent } from '../lib/types'

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Personal calendar backed by GET /api/events/my. Create a plan (chatId null); events
// shared to chats also appear here once added to the calendar.
export function CalendarPage() {
  const [events, setEvents] = useState<LoomEvent[] | null>(null)
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [addOpen, setAddOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(new Date().toDateString())

  const load = () => eventsApi.my().then(setEvents).catch(() => setEvents([]))
  useEffect(() => { void load() }, [])

  const monthLabel = cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })
  const cells = useMemo(() => buildMonth(cursor), [cursor])
  const byDay = useMemo(() => {
    const m = new Map<string, LoomEvent[]>()
    for (const e of events ?? []) { const k = new Date(e.eventDateTime).toDateString(); if (!m.has(k)) m.set(k, []); m.get(k)!.push(e) }
    return m
  }, [events])
  const upcoming = useMemo(
    () => [...(events ?? [])].filter((e) => new Date(e.eventDateTime) >= new Date(Date.now() - 3600_000)).sort((a, b) => +new Date(a.eventDateTime) - +new Date(b.eventDateTime)).slice(0, 8),
    [events],
  )
  const todayStr = new Date().toDateString()

  return (
    <div className="pane" style={{ height: '100%', flexDirection: 'row' }}>
      <div className="list-col" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="pane-head">
          <div className="pane-title">Calendar</div>
          <button className="icon-btn" onClick={() => setAddOpen(true)}><Plus size={20} /></button>
        </div>

        <div style={{ padding: '0 16px', flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
          {events === null ? <CenterSpinner /> : <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 12px' }}>
              <button className="icon-btn" onClick={() => setCursor((d) => addMonth(d, -1))}><ChevronLeft size={20} /></button>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{monthLabel}</div>
              <button className="icon-btn" onClick={() => setCursor((d) => addMonth(d, 1))}><ChevronRight size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
              {WD.map((w) => <div key={w} className="muted" style={{ textAlign: 'center', fontSize: 11, fontWeight: 700 }}>{w}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
              {cells.map((c, i) => {
                const key = c.date.toDateString()
                const isToday = key === todayStr
                const evs = byDay.get(key) ?? []
                const isSel = selected === key
                return (
                  <button key={i} onClick={() => setSelected(key)}
                    style={{
                      aspectRatio: '1', borderRadius: 11, border: evs.length ? '1px solid var(--hairline)' : '1px solid transparent',
                      background: isToday ? 'var(--accent)' : isSel ? 'var(--surface-2)' : evs.length ? 'var(--surface-2)' : 'transparent',
                      color: isToday ? 'var(--on-accent)' : c.inMonth ? 'var(--text)' : 'var(--text-2)',
                      opacity: c.inMonth ? 1 : 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 13.5, fontWeight: 600,
                    }}>
                    {c.date.getDate()}
                    {evs.length > 0 && <span style={{ width: 5, height: 5, borderRadius: '50%', background: isToday ? 'var(--on-accent)' : 'var(--accent)' }} />}
                  </button>
                )
              })}
            </div>

            {selected && (
              <div style={{ marginTop: 16 }}>
                <div className="section-label" style={{ padding: '0 0 6px' }}>{new Date(selected).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                {(byDay.get(selected) ?? []).length === 0
                  ? <div className="muted" style={{ fontSize: 13.5 }}>No events.</div>
                  : (byDay.get(selected) ?? []).map((e) => <EventRow key={e.id} e={e} />)}
              </div>
            )}
          </>}
        </div>
      </div>

      <div className="main-col mobile-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="pane-head desktop-only"><div className="pane-title">Upcoming</div></div>
        <div className="pane-body" style={{ padding: 16 }}>
          {events === null ? null
            : upcoming.length === 0 ? <div className="muted">Nothing upcoming. Tap + to add a plan.</div>
              : upcoming.map((e) => <EventRow key={e.id} e={e} big />)}
        </div>
      </div>

      {addOpen && <CreateEventModal chatId={null} title="New plan" onClose={() => setAddOpen(false)} onCreated={() => void load()} />}
    </div>
  )
}

function EventRow({ e, big }: { e: LoomEvent; big?: boolean }) {
  const navigate = useNavigate()
  const d = new Date(e.eventDateTime)
  const clickable = !!e.chatId
  return (
    <button className="list-row" onClick={() => { if (e.chatId) navigate(`/chat/${e.chatId}`) }}
      style={{ border: '1px solid var(--hairline)', borderRadius: 14, marginBottom: 8, width: '100%', cursor: clickable ? 'pointer' : 'default' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>{d.toLocaleDateString([], { month: 'short' })}</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{d.getDate()}</div>
        </div>
      </div>
      <div className="grow" style={{ textAlign: 'left' }}>
        <div className="lr-title" style={{ fontSize: big ? 15 : 14.5 }}>{e.title}</div>
        <div className="lr-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {e.goingCount > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Users size={12} /> {e.goingCount}</span>}
          {e.chatId && <span>· shared</span>}
        </div>
      </div>
    </button>
  )
}

function buildMonth(cursor: Date): { date: Date; inMonth: boolean }[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const startDow = (first.getDay() + 6) % 7
  const start = new Date(first); start.setDate(1 - startDow)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i)
    return { date: d, inMonth: d.getMonth() === cursor.getMonth() }
  })
}
function addMonth(d: Date, n: number): Date { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
