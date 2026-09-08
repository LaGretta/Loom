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

interface MockState {
  // Empty until a real calls endpoint exists — we do NOT invent call history.
  calls: CallRecord[]
  // Saved gifts to profile (local collection, layered on top of API "my gifts")
  savedGiftInstanceIds: number[]
  saveGift: (id: number) => void
}

export const useMock = create<MockState>((set) => ({
  calls: [],
  savedGiftInstanceIds: [],
  saveGift: (id) => set((s) => (s.savedGiftInstanceIds.includes(id) ? s : { savedGiftInstanceIds: [...s.savedGiftInstanceIds, id] })),
}))
