import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { useAuth } from '../store/auth'
import { Avatar } from '../ui/Avatar'
import { CraftedObject } from '../ui/CraftedObject'
import { Button } from '../ui/primitives'
import { AccountRows } from './account-rows'
import { giftsApi } from '../lib/api'
import { giftByName } from '../assets/loom'
import type { GiftInstance } from '../lib/types'

export function ProfileHub() {
  const me = useAuth((s) => s.me)
  const navigate = useNavigate()
  const premium = me?.premiumTier === 'Premium'
  const [gifts, setGifts] = useState<GiftInstance[]>([])

  useEffect(() => { giftsApi.mine().then(setGifts).catch(() => {}) }, [])

  if (!me) return null

  return (
    <div className="pane" style={{ height: '100%' }}>
      <div className="pane-head desktop-only"><div className="pane-title">Profile</div></div>
      <div className="pane-body" style={{ paddingBottom: 100 }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          {/* hero */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 16px 8px', textAlign: 'center' }}>
            <Avatar name={me.displayName} id={me.id} src={me.avatarUrl} size={96} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <span style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-.02em' }}>{me.displayName}</span>
              {premium && <CraftedObject id="s-gem" size={26} />}
            </div>
            <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>@{me.userName}</div>
            {me.bio && <div style={{ fontSize: 14, marginTop: 10, maxWidth: 420 }}>{me.bio}</div>}
            <Button variant="secondary" style={{ marginTop: 16, padding: '9px 20px' }} onClick={() => navigate('/profile/edit')}>
              <Pencil size={16} /> Edit profile
            </Button>
          </div>

          {/* gifts showcase */}
          <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Gifts · {gifts.length}</span>
            {gifts.length > 0 && <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/gifts')}>See all</span>}
          </div>
          {gifts.length === 0
            ? <div className="muted" style={{ padding: '4px 18px 14px', fontSize: 13.5 }}>No gifts yet. Send or receive collectible gifts to build your showcase.</div>
            : <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 16px 16px' }}>
                {gifts.map((g) => {
                  const meta = giftByName(g.giftName)
                  return (
                    <div key={g.id} style={{ flex: '0 0 auto', width: 84, textAlign: 'center' }}>
                      <div style={{ width: 84, height: 84, borderRadius: 16, display: 'grid', placeItems: 'center', background: meta ? `radial-gradient(120% 100% at 50% 18%, ${meta.g1}, ${meta.g2})` : 'var(--surface-2)' }}>
                        {meta ? <CraftedObject id={meta.sym} kind="gift" size={66} /> : <img src={g.giftImageUrl} width={54} height={54} alt="" />}
                      </div>
                      <div className="ellipsis" style={{ fontSize: 11.5, marginTop: 5 }}>{g.giftName}</div>
                    </div>
                  )
                })}
              </div>}

          <AccountRows />
        </div>
      </div>
    </div>
  )
}
