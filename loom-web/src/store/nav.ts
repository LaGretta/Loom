import { create } from 'zustand'

// Shared open-state for the burger menu. The trigger lives in two places depending on
// the screen (inside the chat-list island on the chat screen; in the left dock elsewhere),
// so the open-state is lifted here instead of drilled through the pane tree.
interface NavState {
  menuOpen: boolean
  openMenu: () => void
  closeMenu: () => void
}

export const useNav = create<NavState>((set) => ({
  menuOpen: false,
  openMenu: () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false }),
}))
