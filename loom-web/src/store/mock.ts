/* Local-only state for surfaces the backend has NO endpoints for yet.
 * (Calendar/Events and Premium are now REAL — moved out of here.)
 * // TODO: wire to backend — Calls history. */
import { create } from 'zustand'

export interface CallRecord {
  id: string
  name: string
  userId?: number
  direction: 'incoming' | 'outgoing' | 'missed'
  video: boolean
  at: string
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
  calls: CallRecord[]
  // Saved gifts to profile (local collection, layered on top of API "my gifts")
  savedGiftInstanceIds: number[]
  saveGift: (id: number) => void
}

export const useMock = create<MockState>((set) => ({
  calls: seedCalls(),
  savedGiftInstanceIds: [],
  saveGift: (id) => set((s) => (s.savedGiftInstanceIds.includes(id) ? s : { savedGiftInstanceIds: [...s.savedGiftInstanceIds, id] })),
}))
