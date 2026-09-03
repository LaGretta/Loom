import { useEffect, useMemo, useState } from 'react'
import { Overlay } from '../ui/Overlay'
import { CraftedObject } from '../ui/CraftedObject'
import { Modal, Button, Segmented, Spinner, CenterSpinner } from '../ui/primitives'
import { Avatar } from '../ui/Avatar'
import { giftsApi, starsApi, usersApi } from '../lib/api'
import { giftByName, GIFT_CATALOG } from '../assets/loom'
import type { GiftMeta } from '../assets/loom'
import { fmtNumber } from '../ui/format'
import { toast } from '../ui/toast'
import { Search, Check } from 'lucide-react'
import type { GiftCatalogItem, GiftInstance, UserSummary } from '../lib/types'

type Tab = 'catalog' | 'mine' | 'craft'

function backdrop(meta?: GiftMeta) {
  return meta ? `radial-gradient(120% 100% at 50% 18%, ${meta.g1}, ${meta.g2})` : 'var(--surface-2)'
}

export function GiftsScreen() {
  const [tab, setTab] = useState<Tab>('catalog')
  const [catalog, setCatalog] = useState<GiftCatalogItem[]>([])
  const [mine, setMine] = useState<GiftInstance[]>([])
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<GiftCatalogItem | null>(null)
  const [sendFor, setSendFor] = useState<GiftCatalogItem | null>(null)

  useEffect(() => {
    Promise.all([
      giftsApi.catalog().catch(() => [] as GiftCatalogItem[]),
      giftsApi.mine().catch(() => [] as GiftInstance[]),
      starsApi.balance().then((b) => b.balance).catch(() => 0),
    ]).then(([c, m, b]) => { setCatalog(c); setMine(m); setBalance(b); setLoading(false) })
  }, [])

  const refresh = async () => {
    const [m, b] = await Promise.all([giftsApi.mine(), starsApi.balance()])
    setMine(m); setBalance(b.balance)
  }

  return (
    <Overlay title="Gifts" wide>
      <div style={{ padding: '8px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
          <CraftedObject id="s-coin" size={26} />
          <span style={{ fontWeight: 800, fontSize: 16 }}>{fmtNumber(balance)}</span>
          <span className="muted" style={{ fontSize: 13 }}>Stars</span>
        </div>
        <Segmented<Tab> value={tab} onChange={setTab} options={[
          { value: 'catalog', label: 'Catalog' }, { value: 'mine', label: `My Gifts` }, { value: 'craft', label: 'Craft' },
        ]} />
      </div>

      {loading ? <CenterSpinner /> : (
        <div style={{ padding: 16 }}>
          {tab === 'catalog' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              {catalog.length === 0 && <div className="muted" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20 }}>Catalog is empty.</div>}
              {catalog.map((g) => {
                const meta = giftByName(g.name)
                return (
                  <button key={g.id} onClick={() => setDetail(g)} style={{ border: '1px solid var(--hairline)', borderRadius: 16, overflow: 'hidden', background: 'var(--surface)' }}>
                    <div style={{ height: 130, display: 'grid', placeItems: 'center', background: backdrop(meta), position: 'relative' }}>
                      {meta ? <CraftedObject id={meta.sym} kind="gift" size={92} /> : <img src={g.imageUrl} width={72} height={72} alt="" />}
                      {meta && <span className={`rarity ${meta.r === 'LEGENDARY' ? 'legendary' : 'other'}`} style={{ position: 'absolute', top: 8, left: 8 }}>{meta.r}</span>}
                    </div>
                    <div style={{ padding: '8px 10px', textAlign: 'left' }}>
                      <div className="lr-title ellipsis" style={{ fontSize: 14.5 }}>{g.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                        <CraftedObject id="s-coin" size={16} /><span style={{ fontWeight: 700, fontSize: 13 }}>{fmtNumber(g.starCost)}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {tab === 'mine' && (
            mine.length === 0
              ? <div className="empty" style={{ height: 'auto', padding: 40 }}><CraftedObject id="s-gift" size={72} /><div className="et">No gifts yet</div><div>Gifts you receive appear here.</div></div>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {mine.map((g) => {
                    const meta = giftByName(g.giftName)
                    return (
                      <div key={g.id} style={{ border: '1px solid var(--hairline)', borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{ height: 110, display: 'grid', placeItems: 'center', background: backdrop(meta) }}>
                          {meta ? <CraftedObject id={meta.sym} kind="gift" size={78} /> : <img src={g.giftImageUrl} width={60} height={60} alt="" />}
                        </div>
                        <div style={{ padding: '7px 8px' }}>
                          <div className="ellipsis" style={{ fontSize: 13, fontWeight: 600 }}>{g.giftName}</div>
                          <div className="lr-sub">from {g.senderName}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
          )}

          {tab === 'craft' && <CraftPanel owned={mine} />}
        </div>
      )}

      {detail && (
        <GiftDetail gift={detail} balance={balance} onClose={() => setDetail(null)}
          onSend={() => { setSendFor(detail); setDetail(null) }}
          onBought={async () => { await refresh(); setDetail(null) }} />
      )}
      {sendFor && (
        <SendGiftModal gift={sendFor} onClose={() => setSendFor(null)} onSent={async () => { await refresh(); setSendFor(null) }} />
      )}
    </Overlay>
  )
}

function GiftDetail({ gift, balance, onClose, onSend, onBought }: {
  gift: GiftCatalogItem; balance: number; onClose: () => void; onSend: () => void; onBought: () => void
}) {
  const meta = giftByName(gift.name)
  const [busy, setBusy] = useState(false)
  const buy = async () => {
    if (balance < gift.starCost) { toast('Not enough Stars — top up first'); return }
    // Buying-for-self isn't a distinct endpoint; gifting to self via send. // TODO(backend): purchase-to-inventory endpoint
    setBusy(true)
    try {
      const me = (await usersApi.me()).id
      await giftsApi.send({ giftId: gift.id, receiverId: me })
      toast('Added to your collection')
      onBought()
    } catch (e: any) { toast(e?.message ?? 'Purchase failed') }
    finally { setBusy(false) }
  }
  return (
    <Modal title={gift.name} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onSend}>Send gift</Button><Button onClick={() => void buy()} disabled={busy}><CraftedObject id="s-coin" size={18} /> {busy ? '…' : fmtNumber(gift.starCost)}</Button></>}>
      <div style={{ height: 200, borderRadius: 16, display: 'grid', placeItems: 'center', background: backdrop(meta), position: 'relative', overflow: 'hidden' }}>
        {meta ? <CraftedObject id={meta.sym} kind="gift" size={150} /> : <img src={gift.imageUrl} width={120} height={120} alt="" />}
        {meta && <span className={`rarity ${meta.r === 'LEGENDARY' ? 'legendary' : 'other'}`} style={{ position: 'absolute', top: 12, left: 12 }}>{meta.r}</span>}
        {meta && <span className="chip" style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11 }}>{meta.ed}</span>}
      </div>
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, marginTop: 14 }}>
        A crafted collectible for your profile showcase. {meta?.r === 'LEGENDARY' ? 'One of the rarest pieces in Loom.' : 'Send it to a friend or keep it for yourself.'}
      </p>
    </Modal>
  )
}

function SendGiftModal({ gift, onClose, onSent }: { gift: GiftCatalogItem; onClose: () => void; onSent: () => void }) {
  const meta = giftByName(gift.name)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<UserSummary[]>([])
  const [picked, setPicked] = useState<UserSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    let alive = true
    const t = setTimeout(async () => {
      if (!q.trim()) { setResults([]); return }
      setSearching(true)
      try { const r = await usersApi.search(q.trim()); if (alive) setResults(r) } catch { /* ignore */ }
      finally { if (alive) setSearching(false) }
    }, 300)
    return () => { alive = false; clearTimeout(t) }
  }, [q])

  const send = async () => {
    if (!picked) { toast('Pick a recipient'); return }
    setBusy(true)
    try {
      await giftsApi.send({ giftId: gift.id, receiverId: picked.id })
      toast(`Gift sent to ${picked.displayName} 🎉`)
      onSent()
    } catch (e: any) { toast(e?.message ?? 'Could not send gift') }
    finally { setBusy(false) }
  }

  return (
    <Modal title="Send gift" onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => void send()} disabled={busy || !picked}><CraftedObject id="s-coin" size={18} /> Send · {fmtNumber(gift.starCost)}</Button></>}>
      <div style={{ height: 130, borderRadius: 14, display: 'grid', placeItems: 'center', background: backdrop(meta), marginBottom: 12 }}>
        {meta ? <CraftedObject id={meta.sym} kind="gift" size={100} /> : <img src={gift.imageUrl} width={80} height={80} alt="" />}
      </div>
      <div className="search" style={{ margin: '0 0 10px' }}>
        <Search size={17} /><input placeholder="Search recipient" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      </div>
      <div style={{ minHeight: 100 }}>
        {searching ? <div className="center-fill" style={{ height: 100 }}><Spinner /></div>
          : results.map((u) => (
            <button key={u.id} className="list-row" style={{ borderRadius: 12 }} onClick={() => setPicked(u)}>
              <Avatar name={u.displayName} id={u.id} src={u.avatarUrl} size={42} ring={picked?.id === u.id} />
              <div className="grow" style={{ textAlign: 'left' }}><div className="lr-title">{u.displayName}</div><div className="lr-sub">@{u.userName}</div></div>
              {picked?.id === u.id && <Check size={20} color="var(--accent)" />}
            </button>
          ))}
      </div>
    </Modal>
  )
}

function CraftPanel({ owned }: { owned: GiftInstance[] }) {
  const [sel, setSel] = useState<number[]>([])
  const chance = useMemo(() => {
    const weights: Record<string, number> = { UNCOMMON: 6, RARE: 12, EPIC: 20, LEGENDARY: 34 }
    let sum = 0
    for (const id of sel) {
      const inst = owned.find((o) => o.id === id)
      const meta = inst && giftByName(inst.giftName)
      sum += meta ? (weights[meta.r] ?? 6) : 6
    }
    return Math.min(95, sum)
  }, [sel, owned])

  const toggle = (id: number) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length < 4 ? [...s, id] : s)

  return (
    <div>
      <div className="muted" style={{ fontSize: 13.5, marginBottom: 12 }}>
        Combine up to 4 gifts to forge a Legendary. (Local preview — not yet persisted.)
      </div>
      {owned.length === 0
        ? <div className="empty" style={{ height: 'auto', padding: 30 }}><CraftedObject id="s-flask" size={64} /><div className="et">Nothing to craft</div><div>You need owned gifts to forge.</div></div>
        : <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {owned.map((g) => {
                const meta = giftByName(g.giftName)
                const on = sel.includes(g.id)
                return (
                  <button key={g.id} onClick={() => toggle(g.id)} style={{ border: on ? '2.5px solid var(--ring)' : '1px solid var(--hairline)', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ height: 90, display: 'grid', placeItems: 'center', background: backdrop(meta) }}>
                      {meta ? <CraftedObject id={meta.sym} kind="gift" size={64} /> : <img src={g.giftImageUrl} width={50} height={50} alt="" />}
                    </div>
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}><span className="muted">Success chance</span><span style={{ fontWeight: 800 }}>{chance}%</span></div>
              <div style={{ height: 10, borderRadius: 6, background: 'var(--surface-2)', overflow: 'hidden' }}><div style={{ width: `${chance}%`, height: '100%', background: 'var(--accent-grad)' }} /></div>
            </div>
            <Button block style={{ marginTop: 16 }} disabled={sel.length < 2} onClick={() => { toast(Math.random() * 100 < chance ? '✨ Forged a Legendary!' : 'Forge failed — try more gifts'); setSel([]) }}>
              <CraftedObject id="s-flask" size={20} /> Forge
            </Button>
          </>}
    </div>
  )
}

// keep GIFT_CATALOG import referenced for design parity
void GIFT_CATALOG
