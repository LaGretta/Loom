// Low-level HTTP with Bearer auth + single-in-flight silent refresh, retry-once on 401.
import { tokenStore } from './tokenStore'

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

type OnAuthLost = () => void
let onAuthLost: OnAuthLost = () => {}
export function setAuthLostHandler(fn: OnAuthLost) { onAuthLost = fn }

// ----- single in-flight refresh -----
// 'refreshed'   → got new tokens, caller may retry.
// 'auth-failed' → server definitively rejected the refresh token (401/403) → log out.
// 'unreachable' → network error / 5xx / malformed → server problem, DO NOT wipe the session.
export type RefreshResult = 'refreshed' | 'auth-failed' | 'unreachable'
let refreshInFlight: Promise<RefreshResult> | null = null

// Refresh tokens are SINGLE-USE (rotated on every refresh). If two tabs refresh at once,
// the loser reuses a now-consumed token and gets logged out. We prevent that by:
//  (a) `prevAccess` snapshot — if the stored access token already changed (another tab
//      refreshed), adopt it instead of consuming the refresh token again; and
//  (b) a cross-tab Web Lock so only one tab performs the network refresh at a time.
async function performRefresh(prevAccess: string | null): Promise<RefreshResult> {
  if (prevAccess && tokenStore.access && tokenStore.access !== prevAccess) return 'refreshed'
  const rt = tokenStore.refresh
  if (!rt) return 'auth-failed'
  let res: Response
  try {
    res = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // ⚠️ backend reads a RAW JSON string body ([FromBody] string), not an object.
      body: JSON.stringify(rt),
    })
  } catch {
    return 'unreachable' // network down — keep the session
  }
  if (res.status === 401 || res.status === 403) return 'auth-failed' // refresh token rejected
  if (!res.ok) return 'unreachable' // 5xx etc. — server problem, don't log out
  try {
    const data = await res.json()
    const access = data.accessToken || data.token
    const refresh = data.refreshToken
    if (!access || !refresh) return 'unreachable' // malformed — don't wipe
    tokenStore.setTokens(access, refresh) // persist rotated tokens (both) to localStorage
    return 'refreshed'
  } catch {
    return 'unreachable'
  }
}

async function doRefresh(prevAccess: string | null): Promise<RefreshResult> {
  const locks = (typeof navigator !== 'undefined' && (navigator as any).locks) || null
  if (locks?.request) {
    try { return await locks.request('loom.token.refresh', () => performRefresh(prevAccess)) }
    catch { return performRefresh(prevAccess) }
  }
  return performRefresh(prevAccess)
}

function refreshOnce(prevAccess: string | null): Promise<RefreshResult> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh(prevAccess).finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

interface ReqOpts {
  method?: string
  body?: unknown
  /** send raw (already-stringified / FormData). Default: JSON.stringify(body). */
  raw?: boolean
  auth?: boolean
  signal?: AbortSignal
}

async function raw(path: string, opts: ReqOpts, isRetry = false): Promise<Response> {
  const headers: Record<string, string> = {}
  const auth = opts.auth !== false
  const sentToken = auth ? tokenStore.access : null
  if (auth && sentToken) headers['Authorization'] = `Bearer ${sentToken}`
  let body: BodyInit | undefined
  if (opts.body instanceof FormData) {
    body = opts.body
  } else if (opts.raw && typeof opts.body === 'string') {
    body = opts.body
    headers['Content-Type'] = 'application/json'
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body)
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, { method: opts.method ?? 'GET', headers, body, signal: opts.signal })

  if (res.status === 401 && auth && !isRetry) {
    // Another tab may have already refreshed → the stored token changed → just retry with it,
    // without consuming our (now possibly stale) refresh token.
    if (sentToken && tokenStore.access && tokenStore.access !== sentToken) {
      return raw(path, opts, true)
    }
    const result = await refreshOnce(sentToken)
    if (result === 'refreshed') return raw(path, opts, true)
    if (result === 'auth-failed') {
      // Only a definitive rejection wipes the session.
      tokenStore.clear()
      onAuthLost()
    }
    // 'unreachable' → keep tokens; surface the 401 to the caller, session stays intact.
  }
  return res
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? safeJson(text) : undefined
  if (!res.ok) {
    const msg =
      (data && (data.detail || data.title || data.message)) ||
      `${res.status} ${res.statusText}`
    throw new ApiError(res.status, msg, data)
  }
  return data as T
}

function safeJson(text: string): any {
  try { return JSON.parse(text) } catch { return text }
}

export const http = {
  get: <T>(path: string, o: Omit<ReqOpts, 'method' | 'body'> = {}) => raw(path, { ...o, method: 'GET' }).then(parse<T>),
  post: <T>(path: string, body?: unknown, o: ReqOpts = {}) => raw(path, { ...o, method: 'POST', body }).then(parse<T>),
  put: <T>(path: string, body?: unknown, o: ReqOpts = {}) => raw(path, { ...o, method: 'PUT', body }).then(parse<T>),
  del: <T>(path: string, o: ReqOpts = {}) => raw(path, { ...o, method: 'DELETE' }).then(parse<T>),
  base: BASE,
}
