import { create } from 'zustand'

const KEY = 'loom.notify'

interface Saved { sound: boolean; browser: boolean }
function read(): Saved {
  try { return { sound: true, browser: true, ...JSON.parse(localStorage.getItem(KEY) || '{}') } }
  catch { return { sound: true, browser: true } }
}
function write(s: Saved) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* private mode */ }
}

interface NotifyState {
  sound: boolean
  browser: boolean
  /** live mirror of Notification.permission ('unsupported' where the API is missing) */
  permission: NotificationPermission | 'unsupported'
  setSound: (v: boolean) => void
  setBrowser: (v: boolean) => void
  setPermission: (p: NotificationPermission | 'unsupported') => void
}

const saved = read()

export const useNotify = create<NotifyState>((set, get) => ({
  sound: saved.sound,
  browser: saved.browser,
  permission: typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  setSound: (v) => { set({ sound: v }); write({ sound: v, browser: get().browser }) },
  setBrowser: (v) => { set({ browser: v }); write({ sound: get().sound, browser: v }) },
  setPermission: (p) => set({ permission: p }),
}))
