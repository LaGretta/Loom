import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Overlay } from '../ui/Overlay'
import { CraftedObject } from '../ui/CraftedObject'
import { Button, CenterSpinner } from '../ui/primitives'
import { premiumApi } from '../lib/api'
import { useAuth } from '../store/auth'
import { fmtNumber } from '../ui/format'
import { toast } from '../ui/toast'
import type { PremiumPlan, PremiumStatus } from '../lib/types'

const PERKS = [
  { sym: 's-rocket', title: 'Faster everything', sub: 'Priority delivery & uploads' },
  { sym: 's-gem', title: 'Animated gem badge', sub: 'Stand out next to your name' },
  { sym: 's-paint', title: 'Exclusive wallpapers', sub: 'Living backgrounds & themes' },
  { sym: 's-spectrum', title: 'Gradient name', sub: 'An iridescent display name' },
]

export function PremiumScreen() {
  const me = useAuth((s) => s.me)
  const refreshMe = useAuth((s) => s.refreshMe)
  const [plans, setPlans] = useState<PremiumPlan[]>([])
  const [status, setStatus] = useState<PremiumStatus | null>(null)
  const [selected, setSelected] = useState<number>(12)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const [p, s] = await Promise.allSettled([premiumApi.plans(), premiumApi.status()])
    if (p.status === 'fulfilled') { setPlans(p.value); if (p.value[0]) setSelected(p.value[p.value.length - 1].months) }
    if (s.status === 'fulfilled') setStatus(s.value)
    setLoading(false)
  }
  useEffect(() => { void load() }, [])

  const subscribe = async () => {
    setBusy(true)
    try {
      const s = await premiumApi.subscribe(selected)
      setStatus(s)
      await refreshMe() // premiumTier → badge shows on profile/avatar
      toast('Welcome to Premium ✨')
    } catch (e: any) {
      toast(e?.status === 400 ? 'Not enough Stars — top up first' : (e?.message ?? 'Could not subscribe'))
    } finally { setBusy(false) }
  }

  const isActive = status?.isActive || me?.premiumTier === 'Premium'

  if (loading) return <Overlay title="Loom Premium"><CenterSpinner /></Overlay>

  return (
    <Overlay title="Loom Premium">
      {/* hero */}
      <div style={{ margin: '12px 16px', borderRadius: 20, padding: '30px 20px', textAlign: 'center', color: 'var(--on-accent)', background: 'var(--accent-grad)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ animation: 'lmGem 7s linear infinite', display: 'inline-block' }}><CraftedObject id="s-gem" size={92} /></div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>Loom Premium</div>
        <div style={{ fontSize: 14, opacity: .85, marginTop: 2 }}>
          {isActive && status?.until ? `Active until ${new Date(status.until).toLocaleDateString()}` : 'Everything, elevated.'}
        </div>
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

      {/* plans (real) */}
      <div className="section-label">Choose a plan</div>
      <div style={{ padding: '0 16px 8px', display: 'grid', gridTemplateColumns: `repeat(${Math.min(plans.length, 3)},1fr)`, gap: 10 }}>
        {plans.map((p) => {
          const on = selected === p.months
          const best = p.months === Math.max(...plans.map((x) => x.months))
          return (
            <button key={p.months} onClick={() => setSelected(p.months)}
              style={{ position: 'relative', border: on ? '2.5px solid var(--ring)' : '1px solid var(--hairline)', borderRadius: 16, padding: '16px 8px', background: 'var(--surface)', textAlign: 'center' }}>
              {best && <span className="rarity legendary" style={{ position: 'absolute', top: 8, right: 8 }}>BEST</span>}
              <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 6 }}>
                <CraftedObject id="s-coin" size={20} />
                <span style={{ fontSize: 19, fontWeight: 800 }}>{fmtNumber(p.starCost)}</span>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ padding: '8px 16px 24px' }}>
        <Button block onClick={() => void subscribe()} disabled={busy}>
          {busy ? 'Processing…' : isActive ? `Extend · ⭐ ${fmtNumber(plans.find((p) => p.months === selected)?.starCost ?? 0)}` : `Subscribe · ⭐ ${fmtNumber(plans.find((p) => p.months === selected)?.starCost ?? 0)}`}
        </Button>
        {isActive && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, color: 'var(--success)', fontSize: 13.5, fontWeight: 600 }}><Check size={16} /> Premium is active</div>}
      </div>
    </Overlay>
  )
}
