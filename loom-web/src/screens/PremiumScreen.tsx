import { useState } from 'react'
import { Overlay } from '../ui/Overlay'
import { CraftedObject } from '../ui/CraftedObject'
import { Button } from '../ui/primitives'
import { useMock } from '../store/mock'
import { useAuth } from '../store/auth'
import { toast } from '../ui/toast'
import { Check } from 'lucide-react'

const PERKS = [
  { sym: 's-rocket', title: 'Faster everything', sub: 'Priority delivery & uploads' },
  { sym: 's-gem', title: 'Animated gem badge', sub: 'Stand out next to your name' },
  { sym: 's-paint', title: 'Exclusive wallpapers', sub: 'Living backgrounds & themes' },
  { sym: 's-spectrum', title: 'Gradient name', sub: 'An iridescent display name' },
]

export function PremiumScreen() {
  const active = useMock((s) => s.premiumActive)
  const setPremium = useMock((s) => s.setPremium)
  const me = useAuth((s) => s.me)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly')

  return (
    <Overlay title="Loom Premium">
      {/* hero */}
      <div style={{ margin: '12px 16px', borderRadius: 20, padding: '30px 20px', textAlign: 'center', color: 'var(--on-accent)', background: 'var(--accent-grad)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ animation: 'lmGem 7s linear infinite', display: 'inline-block' }}><CraftedObject id="s-gem" size={92} /></div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>Loom Premium</div>
        <div style={{ fontSize: 14, opacity: .85, marginTop: 2 }}>Everything, elevated.</div>
      </div>

      {/* name preview */}
      <div className="list-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 800, background: 'linear-gradient(120deg,var(--accent),#C86DFF,var(--danger))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{me?.displayName ?? 'Your name'}</span>
        <CraftedObject id="s-gem" size={22} />
      </div>

      {/* perks */}
      <div className="list-card">
        {PERKS.map((p) => (
          <div key={p.title} className="list-row" style={{ cursor: 'default' }}>
            <span className="obj-ic"><CraftedObject id={p.sym} size={36} /></span>
            <div className="grow"><div className="lr-title">{p.title}</div><div className="lr-sub">{p.sub}</div></div>
          </div>
        ))}
      </div>

      {/* plans */}
      <div style={{ padding: '4px 16px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {([['monthly', 'Monthly', '$4.99'], ['yearly', 'Yearly', '$39.99']] as const).map(([id, label, price]) => (
          <button key={id} onClick={() => setPlan(id)} style={{ position: 'relative', border: plan === id ? '2.5px solid var(--ring)' : '1px solid var(--hairline)', borderRadius: 16, padding: '16px 12px', background: 'var(--surface)', textAlign: 'center' }}>
            {id === 'yearly' && <span className="rarity legendary" style={{ position: 'absolute', top: 8, right: 8 }}>SAVE 33%</span>}
            <div style={{ fontSize: 15, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{price}</div>
          </button>
        ))}
      </div>

      <div style={{ padding: '8px 16px 24px' }}>
        {active
          ? <Button block variant="secondary" onClick={() => { setPremium(false); toast('Premium cancelled') }}><Check size={18} /> Premium active — Cancel</Button>
          : <Button block onClick={() => { setPremium(true); toast('Welcome to Premium ✨') }}>Subscribe · 30 days free</Button>}
        <div className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 10 }}>
          Local preview — subscription is not billed or persisted server-side yet.
        </div>
      </div>
    </Overlay>
  )
}
