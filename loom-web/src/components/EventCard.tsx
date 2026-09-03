import { useState } from 'react'
import { CalendarPlus, Check } from 'lucide-react'
import { CraftedObject } from '../ui/CraftedObject'
import { Avatar } from '../ui/Avatar'
import { eventsApi } from '../lib/api'
import { useChat } from '../store/chat'
import { toast } from '../ui/toast'
import type { LoomEvent } from '../lib/types'
import type { RsvpStatus } from '../lib/enums'

const EVENT_COLOR = '#6C5CE7' // calendar/event category color (matches the s-calendar object)

function whenLabel(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const day = d.toLocaleDateString([], { weekday: 'short' })
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const date = d.toLocaleDateString([], { day: 'numeric', month: 'short' })
  return `${day}, ${date} · ${time}`
}

const RSVP_BTNS: { label: string; status: RsvpStatus; color: string }[] = [
  { label: 'Going', status: 'Going', color: 'var(--success)' },
  { label: 'Maybe', status: 'Maybe', color: 'var(--star-gold)' },
  { label: "Can't", status: 'NotGoing', color: 'var(--danger)' },
]

export function EventCard({ event }: { event: LoomEvent }) {
  const upsertEvent = useChat((s) => s.upsertEvent)
  const [busy, setBusy] = useState(false)
  const going = event.attendees.filter((a) => a.status === 'Going')

  const rsvp = async (status: RsvpStatus) => {
    if (busy) return
    setBusy(true)
    // optimistic: toggle off if tapping the current one is not supported by API; just set
    try {
      const updated = await eventsApi.rsvp(event.id, status)
      upsertEvent(updated)
    } catch (e: any) {
      toast(e?.message ?? 'Could not RSVP')
    } finally { setBusy(false) }
  }

  const addToCalendar = async () => {
    if (event.inMyCalendar || busy) return
    setBusy(true)
    try {
      await eventsApi.addToCalendar(event.id)
      upsertEvent({ ...event, inMyCalendar: true })
      toast('Added to your calendar')
    } catch (e: any) {
      toast(e?.message ?? 'Could not add')
    } finally { setBusy(false) }
  }

  return (
    <div className="event-card anim-pop" style={{ position: 'relative', paddingLeft: 12 }}>
      <div style={{ position: 'absolute', left: 0, top: 2, bottom: 2, width: 4, borderRadius: 3, background: EVENT_COLOR }} />

      {/* header */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 48, height: 48, borderRadius: 13, flex: 'none', display: 'grid', placeItems: 'center', border: '1px solid var(--hairline)', background: `color-mix(in srgb, ${EVENT_COLOR} 16%, var(--surface-2))` }}>
          <CraftedObject id="s-calendar" size={40} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.015em', lineHeight: 1.2 }}>{event.title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 3 }}>{whenLabel(event.eventDateTime)}</div>
          {event.description && <div className="ellipsis" style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>{event.description}</div>}
        </div>
      </div>

      {/* attendees + counts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 10px', minHeight: 22 }}>
        {going.length > 0 && (
          <div style={{ display: 'flex', paddingLeft: 7 }}>
            {going.slice(0, 5).map((a) => (
              <span key={a.userId} style={{ marginLeft: -7, borderRadius: '50%', border: '2px solid var(--surface)' }}>
                <Avatar name={a.displayName} id={a.userId} src={a.avatarUrl} size={26} />
              </span>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600 }}>
          {event.goingCount} going
          {event.maybeCount > 0 && ` · ${event.maybeCount} maybe`}
          {event.notGoingCount > 0 && ` · ${event.notGoingCount} can’t`}
        </div>
      </div>

      {/* RSVP */}
      <div style={{ display: 'flex', gap: 6 }}>
        {RSVP_BTNS.map((b) => {
          const active = event.myStatus === b.status
          return (
            <button key={b.status} onClick={() => void rsvp(b.status)} disabled={busy}
              style={{
                flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: active ? b.color : 'var(--surface-2)',
                color: active ? '#fff' : 'var(--text)',
                border: `1px solid ${active ? b.color : 'var(--hairline)'}`,
                transition: 'transform .14s ease',
              }}>
              {b.label}
            </button>
          )
        })}
      </div>

      {/* add to calendar */}
      <button onClick={() => void addToCalendar()} disabled={event.inMyCalendar || busy}
        style={{
          marginTop: 8, width: '100%', textAlign: 'center', padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          color: event.inMyCalendar ? 'var(--success)' : 'var(--accent)', background: 'transparent',
          border: '1px solid var(--hairline)', opacity: event.inMyCalendar ? 0.85 : 1,
        }}>
        {event.inMyCalendar ? <><Check size={15} /> Added to calendar</> : <><CalendarPlus size={15} /> Add to my calendar</>}
      </button>
    </div>
  )
}
