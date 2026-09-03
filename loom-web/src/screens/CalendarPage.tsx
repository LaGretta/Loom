import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useMock, type CalEvent } from '../store/mock'
import { Modal, Button, Segmented } from '../ui/primitives'
import { toast } from '../ui/toast'

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Calendar has NO backend endpoint — local seeded events. // TODO: wire to backend
export function CalendarPage() {
  const events = useMock((s) => s.events)
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [addOpen, setAddOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const monthLabel = cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })
  const cells = useMemo(() => buildMonth(cursor), [cursor])
  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>()
    for (const e of events) { const k = new Date(e.start).toDateString(); if (!m.has(k)) m.set(k, []); m.get(k)!.push(e) }
    return m
  }, [events])

  const upcoming = useMemo(() => [...events].filter((e) => new Date(e.start) >= new Date(Date.now() - 3600_000)).sort((a, b) => +new Date(a.start) - +new Date(b.start)).slice(0, 6), [events])
  const todayStr = new Date().toDateString()

  return (
    <div className="pane" style={{ height: '100%', flexDirection: 'row' }}>
      <div className="list-col" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="pane-head">
          <div className="pane-title">Calendar</div>
          <button className="icon-btn" onClick={() => setAddOpen(true)}><Plus size={20} /></button>
        </div>

        <div style={{ padding: '0 16px', flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
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
        </div>
      </div>

      <div className="main-col mobile-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="pane-head desktop-only"><div className="pane-title">Upcoming</div></div>
        <div className="pane-body" style={{ padding: 16 }}>
          {upcoming.length === 0 ? <div className="muted">Nothing upcoming.</div>
            : upcoming.map((e) => <EventRow key={e.id} e={e} big />)}
        </div>
      </div>

      {addOpen && <AddEventModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}

function EventRow({ e, big }: { e: CalEvent; big?: boolean }) {
  const remove = useMock((s) => s.removeEvent)
  const d = new Date(e.start)
  return (
    <div className="list-row" style={{ border: '1px solid var(--hairline)', borderRadius: 14, marginBottom: 8, cursor: 'default' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>{d.toLocaleDateString([], { month: 'short' })}</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{d.getDate()}</div>
        </div>
      </div>
      <div className="grow">
        <div className="lr-title" style={{ fontSize: big ? 15 : 14.5 }}>{e.title}</div>
        <div className="lr-sub">{e.allDay ? 'All day' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {e.category}</div>
      </div>
      <button className="icon-btn" onClick={() => remove(e.id)} style={{ fontSize: 12 }}>✕</button>
    </div>
  )
}

function AddEventModal({ onClose }: { onClose: () => void }) {
  const add = useMock((s) => s.addEvent)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('12:00')
  const [category, setCategory] = useState<CalEvent['category']>('Meeting')

  const save = () => {
    if (!title.trim()) { toast('Enter a title'); return }
    const start = new Date(`${date}T${time}`).toISOString()
    add({ title: title.trim(), start, category })
    toast('Event added')
    onClose()
  }
  return (
    <Modal title="New event" onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Add event</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <Segmented<CalEvent['category']> value={category} onChange={setCategory}
          options={[{ value: 'Meeting', label: 'Meeting' }, { value: 'Task', label: 'Task' }, { value: 'Reminder', label: 'Reminder' }, { value: 'Personal', label: 'Personal' }]} />
      </div>
    </Modal>
  )
}

function buildMonth(cursor: Date): { date: Date; inMonth: boolean }[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const startDow = (first.getDay() + 6) % 7 // Mon=0
  const start = new Date(first); start.setDate(1 - startDow)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i)
    return { date: d, inMonth: d.getMonth() === cursor.getMonth() }
  })
}
function addMonth(d: Date, n: number): Date { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
