import { useEffect, useState } from 'react'
import { Overlay } from '../ui/Overlay'
import { CraftedObject } from '../ui/CraftedObject'
import { CenterSpinner } from '../ui/primitives'
import { starsApi } from '../lib/api'
import { fmtNumber, timeShort } from '../ui/format'
import { toast } from '../ui/toast'
import type { StarBalance, StarTransaction } from '../lib/types'

const PACKS = [
  { amount: 100, price: '$1.99' },
  { amount: 250, price: '$4.99', tag: 'POPULAR' },
  { amount: 500, price: '$8.99' },
  { amount: 1000, price: '$15.99', tag: 'BEST' },
]

const TX_LABEL: Record<string, string> = {
  Purchase: 'Stars purchased', GiftSent: 'Gift sent', GiftReceived: 'Gift received',
  PremiumPurchase: 'Premium', AdminGrant: 'Bonus', Refund: 'Refund',
}

export function StarsScreen() {
  const [balance, setBalance] = useState<StarBalance | null>(null)
  const [history, setHistory] = useState<StarTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [b, h] = await Promise.all([starsApi.balance(), starsApi.history(1, 40)])
      setBalance(b); setHistory(h.items)
    } catch { toast('Could not load Stars') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const buy = async (amount: number) => {
    setBusy(true)
    try {
      const b = await starsApi.purchase(amount)
      setBalance(b)
      const h = await starsApi.history(1, 40)
      setHistory(h.items)
      toast(`+${amount} Stars added`)
    } catch (e: any) { toast(e?.message ?? 'Purchase failed') }
    finally { setBusy(false) }
  }

  if (loading) return <Overlay title="My Stars"><CenterSpinner /></Overlay>

  return (
    <Overlay title="My Stars">
      {/* hero */}
      <div style={{ margin: '12px 16px', borderRadius: 20, padding: '26px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid var(--hairline)', background: 'radial-gradient(120% 100% at 50% 0%, rgba(232,162,76,.18), transparent 70%), var(--surface)' }}>
        <CraftedObject id="s-coin" size={92} style={{ margin: '0 auto' }} />
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px', marginTop: 8 }}>{fmtNumber(balance?.balance ?? 0)}</div>
        <div className="section-label" style={{ padding: 0, marginTop: 2 }}>Loom Stars Balance</div>
      </div>

      {/* packs */}
      <div className="section-label">Top up</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
        {PACKS.map((p) => (
          <button key={p.amount} disabled={busy} onClick={() => void buy(p.amount)}
            style={{ position: 'relative', border: '1px solid var(--hairline)', background: 'var(--surface)', borderRadius: 16, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {p.tag && <span className="rarity legendary" style={{ position: 'absolute', top: 8, right: 8 }}>{p.tag}</span>}
            <CraftedObject id="s-coin" size={48} />
            <div style={{ fontSize: 19, fontWeight: 800 }}>{fmtNumber(p.amount)}</div>
            <div className="chip" style={{ padding: '4px 12px' }}>{p.price}</div>
          </button>
        ))}
      </div>

      {/* ledger */}
      <div className="section-label">Recent activity</div>
      {history.length === 0
        ? <div className="muted" style={{ padding: '0 18px 18px', fontSize: 13.5 }}>No transactions yet.</div>
        : <div className="list-card">
            {history.map((t) => (
              <div key={t.id} className="list-row" style={{ cursor: 'default' }}>
                <span className="obj-ic"><CraftedObject id="s-coin" size={30} /></span>
                <div className="grow">
                  <div className="lr-title" style={{ fontSize: 14.5 }}>{TX_LABEL[t.type] ?? t.type}</div>
                  <div className="lr-sub">{new Date(t.createdAt).toLocaleDateString()} · {timeShort(t.createdAt)}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: t.amount >= 0 ? 'var(--green)' : 'var(--danger)' }}>
                  {t.amount >= 0 ? '+' : ''}{fmtNumber(t.amount)}
                </div>
              </div>
            ))}
          </div>}
    </Overlay>
  )
}
