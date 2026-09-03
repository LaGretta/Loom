import { create } from 'zustand'

interface ToastItem { id: number; text: string }
interface ToastState {
  items: ToastItem[]
  show: (text: string) => void
  dismiss: (id: number) => void
}
let seq = 1
export const useToast = create<ToastState>((set) => ({
  items: [],
  show: (text) => {
    const id = seq++
    set((s) => ({ items: [...s.items, { id, text }] }))
    window.setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 2500)
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}))

export const toast = (text: string) => useToast.getState().show(text)

export function ToastHost() {
  const items = useToast((s) => s.items)
  return (
    <div className="toast-host">
      {items.map((t) => (
        <div key={t.id} className="toast anim-fade">{t.text}</div>
      ))}
    </div>
  )
}
