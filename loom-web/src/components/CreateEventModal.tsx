import { useState } from 'react'
import { Modal, Button } from '../ui/primitives'
import { CraftedObject } from '../ui/CraftedObject'
import { eventsApi } from '../lib/api'
import { toast } from '../ui/toast'
import type { LoomEvent } from '../lib/types'

// Create an event. If chatId is set it's shared to that chat (a card appears live);
// if null it's a personal plan on the calendar.
export function CreateEventModal({ chatId = null, title: heading = 'New event', onClose, onCreated }: {
  chatId?: number | null
  title?: string
  onClose: () => void
  onCreated?: (ev: LoomEvent) => void
}) {
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
      toast(chatId ? 'Event shared to chat' : 'Event added to calendar')
      onCreated?.(ev)
      onClose()
    } catch (e: any) {
      toast(e?.message ?? 'Could not create event')
    } finally { setBusy(false) }
  }

  return (
    <Modal title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><CraftedObject id="s-calendar" size={24} /> {heading}</span>}
      onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => void submit()} disabled={busy}>{busy ? 'Creating…' : chatId ? 'Share to chat' : 'Add event'}</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <input className="input" placeholder="Location or notes (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        {chatId
          ? <div className="muted" style={{ fontSize: 12.5 }}>Everyone in this chat will see the event card and can RSVP.</div>
          : <div className="muted" style={{ fontSize: 12.5 }}>This plan is saved to your personal calendar.</div>}
      </div>
    </Modal>
  )
}
