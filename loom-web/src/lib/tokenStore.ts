// Persisted auth tokens + cached identity. localStorage wrapped in try/catch.
const K_ACCESS = 'loom.accessToken'
const K_REFRESH = 'loom.refreshToken'
const K_USER = 'loom.user'

export interface StoredUser {
  id: number
  userName: string
  displayName: string
  email: string
}

function read(k: string): string | null {
  try { return localStorage.getItem(k) } catch { return null }
}
function write(k: string, v: string | null) {
  try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* ignore */ }
}

export const tokenStore = {
  get access() { return read(K_ACCESS) },
  get refresh() { return read(K_REFRESH) },
  get user(): StoredUser | null {
    const raw = read(K_USER)
    if (!raw) return null
    try { return JSON.parse(raw) as StoredUser } catch { return null }
  },
  setTokens(access: string, refresh: string) {
    write(K_ACCESS, access)
    write(K_REFRESH, refresh)
  },
  setUser(u: StoredUser) { write(K_USER, JSON.stringify(u)) },
  clear() {
    write(K_ACCESS, null); write(K_REFRESH, null); write(K_USER, null)
  },
}
