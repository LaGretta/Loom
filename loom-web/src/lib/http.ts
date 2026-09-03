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
let refreshInFlight: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  const rt = tokenStore.refresh
  if (!rt) return false
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // ⚠️ backend reads a RAW JSON string body ([FromBody] string), not an object.
      body: JSON.stringify(rt),
    })
    if (!res.ok) return false
    const data = await res.json()
    const access = data.token ?? data.accessToken
    const refresh = data.refreshToken
    if (!access || !refresh) return false
    tokenStore.setTokens(access, refresh)
    return true
  } catch {
    return false
  }
}

function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => { refreshInFlight = null })
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
  if (auth) {
    const t = tokenStore.access
    if (t) headers['Authorization'] = `Bearer ${t}`
  }
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
    const ok = await refreshOnce()
    if (ok) return raw(path, opts, true)
    tokenStore.clear()
    onAuthLost()
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
