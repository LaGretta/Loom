import { useState } from 'react'
import { useAuth } from '../store/auth'
import { Button } from '../ui/primitives'
import { ApiError } from '../lib/http'

// NOTE: the design mock shows a phone-number field, but the backend auth is email/password
// (register: userName, displayName, email, password). Built to the real API. // TODO(design): phone auth
export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userName, setUserName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const login = useAuth((s) => s.login)
  const register = useAuth((s) => s.register)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      if (mode === 'login') await login(email.trim(), password)
      else await register({ userName: userName.trim(), displayName: displayName.trim() || userName.trim(), email: email.trim(), password })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Try again.'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'var(--bg)', overflow: 'hidden', padding: 20 }}>
      {/* living aurora backdrop */}
      <div className="wp wp-aurora" style={{ position: 'fixed', opacity: 0.9 }} aria-hidden>
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      </div>

      <form onSubmit={submit} className="anim-fade" style={{ position: 'relative', zIndex: 1, width: 'min(400px,100%)', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 22, boxShadow: 'var(--shadow)', padding: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <LoomMark />
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', background: 'linear-gradient(120deg,var(--accent),var(--danger))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Loom</div>
          <div className="muted" style={{ fontSize: 14 }}>Weave your conversations together</div>
        </div>

        <div className="segmented" style={{ marginBottom: 18 }}>
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log in</button>
          <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Create account</button>
        </div>

        <div className="vstack" style={{ gap: 12 }}>
          {mode === 'register' && (
            <>
              <input className="input" placeholder="Username" autoComplete="username" value={userName} onChange={(e) => setUserName(e.target.value)} required />
              <input className="input" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </>
          )}
          <input className="input" type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</div>}

        <Button type="submit" block disabled={busy} style={{ marginTop: 18 }}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Continue' : 'Create account'}
        </Button>
      </form>
    </div>
  )
}

function LoomMark() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" style={{ display: 'block' }} aria-hidden>
      <defs>
        <linearGradient id="loomWeave" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--danger)" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#loomWeave)" strokeWidth="3.4" strokeLinecap="round">
        <path d="M12 16 C 24 30, 24 30, 12 44">
          <animate attributeName="stroke-dasharray" values="0 60;60 0" dur="1.4s" fill="freeze" /></path>
        <path d="M24 16 C 36 30, 36 30, 24 44">
          <animate attributeName="stroke-dasharray" values="0 60;60 0" dur="1.4s" begin="0.15s" fill="freeze" /></path>
        <path d="M36 16 C 48 30, 48 30, 36 44">
          <animate attributeName="stroke-dasharray" values="0 60;60 0" dur="1.4s" begin="0.3s" fill="freeze" /></path>
        <path d="M12 30 H 48" opacity="0.5" />
      </g>
    </svg>
  )
}
