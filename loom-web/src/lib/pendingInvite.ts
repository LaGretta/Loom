/**
 * An invite code the visitor opened while signed out. Router state alone isn't enough:
 * they may register instead of logging in, reload the login page, or bounce through a
 * refresh — any of which drops history state. This survives all of that.
 */
const KEY = 'loom.pendingInvite'

export const setPendingInvite = (code: string) => {
  try { localStorage.setItem(KEY, code) } catch { /* private mode — router state still covers it */ }
}
export const peekPendingInvite = (): string | null => {
  try { return localStorage.getItem(KEY) } catch { return null }
}
export const clearPendingInvite = () => {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
