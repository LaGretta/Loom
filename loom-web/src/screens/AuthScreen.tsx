import { useId, useState } from 'react'
import { Eye, EyeOff, Check } from 'lucide-react'
import { useAuth } from '../store/auth'
import { ApiError } from '../lib/http'
import { CraftedObject } from '../ui/CraftedObject'
import { toast } from '../ui/toast'
import '../ui/auth.css'

type Mode = 'login' | 'register'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userName, setUserName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const login = useAuth((s) => s.login)
  const register = useAuth((s) => s.register)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError(null)
    try {
      if (mode === 'login') await login(email.trim(), password)
      else await register({ userName: userName.trim(), displayName: displayName.trim() || userName.trim(), email: email.trim(), password })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-root">
      <AuthHero />

      <main className="auth-form">
        <form className="auth-card" onSubmit={submit}>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <div className="auth-card-sub">
            {mode === 'login' ? 'Log in to continue to Loom.' : 'Join Loom and start weaving conversations.'}
          </div>

          {/* segmented toggle with sliding pill */}
          <div className={`auth-seg ${mode === 'register' ? 'register' : ''}`}>
            <span className="pill" />
            <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setError(null) }}>Log in</button>
            <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setError(null) }}>Create account</button>
          </div>

          {mode === 'register' ? (
            <div className="auth-fields swap" key="reg">
              <div className="auth-field">
                <label>Display name</label>
                <input className="auth-inp" placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <UsernameField value={userName} onChange={setUserName} />
              <div className="auth-field">
                <label>Email</label>
                <input className="auth-inp" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <PasswordField value={password} onChange={setPassword} show={showPw} toggle={() => setShowPw((v) => !v)} withMeter autoComplete="new-password" />
            </div>
          ) : (
            <div className="auth-fields swap" key="log">
              <div className="auth-field">
                <label>Email</label>
                <input className="auth-inp" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="auth-field">
                <div className="auth-row-between">
                  <label style={{ margin: 0 }}>Password</label>
                  {/* No backend reset endpoint yet. // TODO: wire to backend password reset */}
                  <button type="button" className="auth-forgot" onClick={() => toast('Password reset — coming soon')}>Forgot?</button>
                </div>
                <PasswordField value={password} onChange={setPassword} show={showPw} toggle={() => setShowPw((v) => !v)} autoComplete="current-password" noLabel />
              </div>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>

          <div className="auth-switch">
            {mode === 'login'
              ? <>New to Loom? <button type="button" onClick={() => { setMode('register'); setError(null) }}>Create account</button></>
              : <>Already have an account? <button type="button" onClick={() => { setMode('login'); setError(null) }}>Log in</button></>}
          </div>
        </form>
      </main>
    </div>
  )
}

/* ---------------- Hero panel ---------------- */
function AuthHero() {
  return (
    <aside className="auth-hero">
      <div className="silk" aria-hidden />
      <div className="blob v" aria-hidden />
      <div className="blob g" aria-hidden />

      <div className="auth-hero-content">
        <div className="auth-brand">
          <span className="auth-logo-chip"><WovenMark size={30} /></span>
          <span className="auth-wordmark">Loom</span>
        </div>

        <div className="auth-hero-mid">
          <div className="auth-headline">Weave your conversations together.</div>
          <p className="auth-subtitle desktop-hero-only">
            Real-time messaging with presence, typing, collectible gifts, Stars and living themes — crafted to feel effortless.
          </p>

          {/* floating chat preview cluster (desktop) */}
          <div className="auth-cluster desktop-hero-only" aria-hidden>
            <div className="pv">
              <span className="pv-av" />
              <div className="auth-bubble in">Hey! Ready to weave something?<div className="t">10:02</div></div>
            </div>
            <div className="pv out">
              <div className="auth-bubble out">Always. Let’s go ✨<div className="t">10:02 <Check size={12} /></div></div>
            </div>
          </div>

          {/* mobile mascot peeking */}
          <div className="mobile-band-only auth-mascot" aria-hidden>
            <CraftedObject id="loomi-wave" kind="sticker" size={64} />
          </div>
        </div>

        <div className="auth-features desktop-hero-only">
          <Feature glyph={<BoltGlyph />} title="Real-time" desc="Messages, presence & typing — instantly." />
          <Feature glyph={<ShieldGlyph />} title="Private" desc="Secured with token-based auth." />
          <Feature glyph={<SparkGlyph />} title="Crafted" desc="Gifts, Stars & living themes." />
        </div>
      </div>
    </aside>
  )
}

function Feature({ glyph, title, desc }: { glyph: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="auth-feature">
      <span className="tile">{glyph}</span>
      <div>
        <div className="ft-title">{title}</div>
        <div className="ft-desc">{desc}</div>
      </div>
    </div>
  )
}

/* ---------------- Username field with availability ---------------- */
function UsernameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Client-side only for now. // TODO: replace with real GET /api/users/check-username (backend method exists)
  const clean = value.trim()
  const available = clean.length >= 3
  return (
    <div className="auth-field">
      <label>Username</label>
      <span className="auth-prefix">@</span>
      <input
        className="auth-inp has-prefix"
        placeholder="username"
        autoComplete="username"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
        required
      />
      {clean.length > 0 && (
        <div className={`auth-hint ${available ? 'ok' : ''}`}>
          {available ? <><Check size={13} /> Available</> : 'At least 3 characters'}
        </div>
      )}
    </div>
  )
}

/* ---------------- Password field (+ optional strength meter) ---------------- */
function PasswordField({ value, onChange, show, toggle, withMeter, noLabel, autoComplete }: {
  value: string
  onChange: (v: string) => void
  show: boolean
  toggle: () => void
  withMeter?: boolean
  noLabel?: boolean
  autoComplete?: string
}) {
  const score = strength(value)
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const colors = ['var(--danger)', 'var(--star-gold)', 'var(--blue)', 'var(--success)']
  return (
    <div className="auth-field">
      {!noLabel && <label>Password</label>}
      <input
        className="auth-inp has-suffix"
        type={show ? 'text' : 'password'}
        placeholder="••••••••"
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={6}
      />
      <button type="button" className="auth-suffix" onClick={toggle} aria-label={show ? 'Hide password' : 'Show password'} tabIndex={-1}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
      {withMeter && value.length > 0 && (
        <>
          <div className="auth-strength">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="seg" style={{ background: i < score ? colors[Math.max(0, score - 1)] : 'var(--hairline)' }} />
            ))}
          </div>
          <div className="auth-strength-label" style={{ color: colors[Math.max(0, score - 1)] }}>{labels[Math.max(0, score - 1)]}</div>
        </>
      )}
    </div>
  )
}

function strength(pw: string): number {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 6) s++
  if (pw.length >= 10) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(4, s)
}

/* ---------------- Woven logomark + monochrome feature glyphs ---------------- */
function WovenMark({ size = 30 }: { size?: number }) {
  const id = useId().replace(/[:]/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <mask id={`wv-${id}`}>
          <rect x="0" y="0" width="48" height="48" fill="#fff" />
          <rect x="9" y="28.5" width="6" height="7" fill="#000" />
          <rect x="21" y="12.5" width="6" height="7" fill="#000" />
          <rect x="33" y="28.5" width="6" height="7" fill="#000" />
        </mask>
      </defs>
      <g stroke="currentColor" strokeWidth="4.6" strokeLinecap="round">
        <path d="M6 16 H42" />
        <path d="M6 32 H42" />
      </g>
      <g stroke="currentColor" strokeWidth="4.6" strokeLinecap="round" mask={`url(#wv-${id})`}>
        <path d="M12 8 V40" />
        <path d="M24 8 V40" />
        <path d="M36 8 V40" />
      </g>
    </svg>
  )
}

function BoltGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2 L4 14 h6 l-1 8 9-12 h-6 z" fill="rgba(255,255,255,.14)" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}
function ShieldGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 L20 6 v6 c0 5-3.5 7.5-8 9 -4.5-1.5-8-4-8-9 V6 z" fill="rgba(255,255,255,.12)" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="9" y="11" width="6" height="5.5" rx="1.2" fill="none" stroke="#fff" strokeWidth="1.4" />
      <path d="M10 11 V9.5 a2 2 0 0 1 4 0 V11" fill="none" stroke="#fff" strokeWidth="1.4" />
    </svg>
  )
}
function SparkGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2 C12.6 7 13 8 18 12 C13 13 12.6 14 12 22 C11.4 14 11 13 6 12 C11 8 11.4 7 12 2 Z" fill="rgba(255,255,255,.16)" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}
