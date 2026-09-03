import { create } from 'zustand'
import { authApi, usersApi, logoutEverywhere } from '../lib/api'
import { tokenStore, type StoredUser } from '../lib/tokenStore'
import { setAuthLostHandler, ApiError } from '../lib/http'
import { signalr } from '../lib/signalr'
import { pickAccessToken, type UserProfile } from '../lib/types'

// Minimal profile from the cached identity, used to keep the session alive when the
// server is briefly unreachable (so a refresh doesn't kick the user to login).
function cachedToProfile(u: StoredUser): UserProfile {
  return {
    id: u.id, userName: u.userName, displayName: u.displayName,
    bio: null, avatarUrl: null, status: 'Offline',
    lastSeenAt: new Date().toISOString(), premiumTier: 'None',
  }
}

interface AuthState {
  me: UserProfile | null
  ready: boolean            // finished bootstrap attempt
  authed: boolean
  error: string | null
  bootstrap: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (b: { userName: string; displayName: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
  setMe: (u: UserProfile) => void
}

export const useAuth = create<AuthState>((set, get) => ({
  me: null,
  ready: false,
  authed: false,
  error: null,

  bootstrap: async () => {
    if (!tokenStore.access) { set({ ready: true, authed: false }); return }
    try {
      const me = await usersApi.me()
      set({ me, authed: true, ready: true })
      void signalr.start()
    } catch (e) {
      // Log out ONLY on a definitive auth rejection. `http` already ran silent refresh and,
      // if the refresh token was rejected, cleared the tokens (so tokenStore.access is now
      // null). A transient error (server down, 5xx, network) must NOT wipe the session —
      // keep the cached identity so it recovers on the next load / when the API returns.
      const authFailed = !tokenStore.access || (e instanceof ApiError && (e.status === 401 || e.status === 403))
      if (authFailed) {
        tokenStore.clear()
        set({ ready: true, authed: false, me: null })
      } else {
        const cached = tokenStore.user
        set({ me: cached ? cachedToProfile(cached) : null, authed: !!cached, ready: true })
        if (cached) { void signalr.start(); void get().refreshMe() }
      }
    }
  },

  login: async (email, password) => {
    set({ error: null })
    const res = await authApi.login({ email, password })
    tokenStore.setTokens(pickAccessToken(res), res.refreshToken)
    tokenStore.setUser({ id: res.id, userName: res.userName, displayName: res.displayName, email: res.email })
    const me = await usersApi.me()
    set({ me, authed: true })
    void signalr.start()
  },

  register: async (b) => {
    set({ error: null })
    const res = await authApi.register(b)
    tokenStore.setTokens(pickAccessToken(res), res.refreshToken)
    tokenStore.setUser({ id: res.id, userName: res.userName, displayName: res.displayName, email: res.email })
    const me = await usersApi.me()
    set({ me, authed: true })
    void signalr.start()
  },

  logout: async () => {
    await signalr.stop()
    await logoutEverywhere()
    set({ me: null, authed: false })
  },

  refreshMe: async () => {
    try { set({ me: await usersApi.me() }) } catch { /* ignore */ }
  },

  setMe: (u) => set({ me: u }),
}))

// When silent refresh fails, drop auth state so the router redirects to login.
setAuthLostHandler(() => {
  void signalr.stop()
  useAuth.setState({ me: null, authed: false })
})
