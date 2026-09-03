import { create } from 'zustand'
import { authApi, usersApi, logoutEverywhere } from '../lib/api'
import { tokenStore } from '../lib/tokenStore'
import { setAuthLostHandler } from '../lib/http'
import { signalr } from '../lib/signalr'
import { pickAccessToken, type UserProfile } from '../lib/types'

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
    } catch {
      tokenStore.clear()
      set({ ready: true, authed: false, me: null })
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
