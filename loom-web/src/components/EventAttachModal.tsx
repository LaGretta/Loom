import { useEffect, useMemo, useState } from 'react'
import { Modal, Button, Segmented, Spinner } from '../ui/primitives'
import { CraftedObject } from '../ui/CraftedObject'
import { eventsApi } from '../lib/api'
import { useChat } from '../store/chat'
import { toast } from '../ui/toast'
import type { LoomEvent } from '../lib/types'

type Tab = 'new' | 'existing'

// Attach → Event inside a chat: create a NEW event for this chat, or SHARE an existing
// plan from my calendar into it. Both make a card appear live for everyone (EventShared).
export function EventAttachModal({ chatId, onClose }: { chatId: number; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('new')
  const upsertEvent = useChat((s) => s.upsertEvent)
  const chatEvents = useChat((s) => s.events[chatId]) ?? []

  return (
    <Modal
      title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><CraftedObject id="s-calendar" size={24} /> Event</span>}
      onClose={onClose}
    >
      <div style={{ marginBottom: 16 }}>
        <Segmented<Tab> value={tab} onChange={setTab}
          options={[{ value: 'new', label: 'New event' }, { value: 'existing', label: 'Share a plan' }]} />
      </div>
      {tab === 'new'
        ? <NewEventForm chatId={chatId} onDone={(ev) => { upsertEvent(ev); onClose() }} onCancel={onClose} />
        : <ShareExistingList chatId={chatId} alreadyShared={chatEvents.map((e) => e.id)} onShared={onClose} />}
    </Modal>
  )
}

function NewEventForm({ chatId, onDone, onCancel }: { chatId: number; onDone: (ev: LoomEvent) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10))
  const [time, setTime] = useState('16:00')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!title.trim()) { toast('Enter a title'); return }
    setBusy(true)
    try {
      const eventDateTime = new Date(`${date}T${time}`).toISOString()
      const ev = await eventsApi.create({ title: title.trim(), description: description.trim() || null, eventDateTime, chatId })
      toast('Event shared to chat')
      onDone(ev)
    } catch (e: any) { toast(e?.message ?? 'Could not create event') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <input className="input" placeholder="Location or notes (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div style={{ display: 'flex', gap: 10 }}>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="muted" style={{ fontSize: 12.5 }}>Everyone in this chat will see the event card and can RSVP.</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <Button variant="secondary" block onClick={onCancel}>Cancel</Button>
        <Button block onClick={() => void submit()} disabled={busy}>{busy ? 'Sharing…' : 'Share to chat'}</Button>
      </div>
    </div>
  )
}

function ShareExistingList({ chatId, alreadyShared, onShared }: { chatId: number; alreadyShared: number[]; onShared: () => void }) {
  const upsertEvent = useChat((s) => s.upsertEvent)
  const [events, setEvents] = useState<LoomEvent[] | null>(null)
  const [sharingId, setSharingId] = useState<number | null>(null)

  useEffect(() => { eventsApi.my().then(setEvents).catch(() => setEvents([])) }, [])

  const shareable = useMemo(
    () => (events ?? []).filter((e) => !alreadyShared.includes(e.id) && e.chatId !== chatId),
    [events, alreadyShared, chatId],
  )

  const share = async (ev: LoomEvent) => {
    setSharingId(ev.id)
    try {
      await eventsApi.share(ev.id, chatId)
      // reflect immediately; the live EventShared broadcast covers everyone else
      upsertEvent({ ...ev, chatId })
      toast('Plan shared to chat')
      onShared()
    } catch (e: any) {
      toast(e?.status === 403 ? "You're not a member of this chat" : (e?.message ?? 'Could not share plan'))
    } finally { setSharingId(null) }
  }

  if (events === null) return <div className="center-fill" style={{ height: 140 }}><Spinner /></div>
  if (shareable.length === 0) {
    return (
      <div className="empty" style={{ height: 'auto', padding: 24 }}>
        <CraftedObject id="s-calendar" size={56} />
        <div className="et">No plans to share</div>
        <div>Create a plan in your Calendar first, then share it here.</div>
      </div>
    )
  }

  return (
    <div style={{ maxHeight: 340, overflowY: 'auto' }}>
      {shareable.map((e) => {
        const d = new Date(e.eventDateTime)
        return (
          <button key={e.id} className="list-row" style={{ borderRadius: 12, width: '100%' }} disabled={sharingId != null} onClick={() => void share(e)}>
            <div style={{ width: 42, height: 42, borderRadius: 11, flex: 'none', display: 'grid', placeItems: 'center', border: '1px solid var(--hairline)', background: 'color-mix(in srgb, #6C5CE7 16%, var(--surface-2))' }}>
              <CraftedObject id="s-calendar" size={30} />
            </div>
            <div className="grow" style={{ textAlign: 'left' }}>
              <div className="lr-title">{e.title}</div>
              <div className="lr-sub">{d.toLocaleDateString([], { day: 'numeric', month: 'short' })} · {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>{sharingId === e.id ? '…' : 'Share'}</span>
          </button>
        )
      })}
    </div>
  )
}
