/* Local-only state for surfaces the backend has NO endpoints for yet.
 * Everything here is in-memory (seeded) + localStorage where useful.
 * // TODO: wire to backend — see the "ЩО ТРЕБА ДОРОБИТИ НА БЕКЕНДІ" report. */
import { create } from 'zustand'

/* ---------- Calendar events (no backend) ---------- */
export interface CalEvent {
  id: string
  title: string
  notes?: string
  start: string        // ISO
  allDay?: boolean
  category: 'Meeting' | 'Task' | 'Reminder' | 'Personal'
}
export interface CallRecord {
  id: string
  name: string
  userId?: number
  direction: 'incoming' | 'outgoing' | 'missed'
  video: boolean
  at: string
}

function seedEvents(): CalEvent[] {
  const now = new Date()
  const mk = (dayOffset: number, h: number, title: string, category: CalEvent['category']): CalEvent => {
    const d = new Date(now); d.setDate(now.getDate() + dayOffset); d.setHours(h, 0, 0, 0)
    return { id: crypto.randomUUID(), title, start: d.toISOString(), category }
  }
  return [
    mk(0, 10, 'Design sync', 'Meeting'),
    mk(0, 15, 'Ship Loom beta', 'Task'),
    mk(1, 9, 'Standup', 'Meeting'),
    mk(2, 18, 'Call with Mira', 'Personal'),
    mk(4, 12, 'Submit report', 'Reminder'),
    mk(7, 14, 'Team lunch', 'Personal'),
  ]
}
function seedCalls(): CallRecord[] {
  const now = Date.now()
  const at = (minAgo: number) => new Date(now - minAgo * 60000).toISOString()
  return [
    { id: '1', name: 'Mira Chen', direction: 'incoming', video: true, at: at(35) },
    { id: '2', name: 'Devon Park', direction: 'outgoing', video: false, at: at(180) },
    { id: '3', name: 'Aria Voss', direction: 'missed', video: false, at: at(600) },
    { id: '4', name: 'Team Loom', direction: 'outgoing', video: true, at: at(1500) },
  ]
}

interface MockState {
  events: CalEvent[]
  addEvent: (e: Omit<CalEvent, 'id'>) => void
  removeEvent: (id: string) => void
  calls: CallRecord[]
  // Premium (local)
  premiumActive: boolean
  setPremium: (v: boolean) => void
  // Saved gifts to profile (local collection, layered on top of API "my gifts")
  savedGiftInstanceIds: number[]
  saveGift: (id: number) => void
}

const PREM_KEY = 'loom.premium'
const readPrem = () => { try { return localStorage.getItem(PREM_KEY) === '1' } catch { return false } }

export const useMock = create<MockState>((set) => ({
  events: seedEvents(),
  addEvent: (e) => set((s) => ({ events: [...s.events, { ...e, id: crypto.randomUUID() }] })),
  removeEvent: (id) => set((s) => ({ events: s.events.filter((x) => x.id !== id) })),
  calls: seedCalls(),
  premiumActive: readPrem(),
  setPremium: (v) => { try { localStorage.setItem(PREM_KEY, v ? '1' : '0') } catch { /* ignore */ } set({ premiumActive: v }) },
  savedGiftInstanceIds: [],
  saveGift: (id) => set((s) => (s.savedGiftInstanceIds.includes(id) ? s : { savedGiftInstanceIds: [...s.savedGiftInstanceIds, id] })),
}))
