import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Overlay } from '../ui/Overlay'
import { Avatar } from '../ui/Avatar'
import { CraftedObject } from '../ui/CraftedObject'
import { Switch, CenterSpinner } from '../ui/primitives'
import { usersApi, chatsApi, giftsApi } from '../lib/api'
import { giftByName } from '../assets/loom'
import { lastSeen } from '../ui/format'
import { isOnline } from '../lib/enums'
import { toast } from '../ui/toast'
import type { UserProfile, GiftInstance } from '../lib/types'

const ACTIONS: { sym: string; label: string }[] = [
  { sym: 's-bubble', label: 'Message' },
  { sym: 's-phone', label: 'Call' },
  { sym: 's-video', label: 'Video' },
  { sym: 's-gift', label: 'Gift' },
]

export function UserProfileScreen() {
  const { id } = useParams()
  const uid = Number(id)
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [gifts, setGifts] = useState<GiftInstance[]>([])
  const [muted, setMuted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    usersApi.byId(uid).then(setUser).catch(() => toast('Could not load profile')).finally(() => setLoading(false))
    giftsApi.mine().then((all) => setGifts(all.filter((g) => g.receiverId === uid))).catch(() => {})
  }, [uid])

  const openChat = async () => {
    try {
      const chat = await chatsApi.create({ type: 'Direct', memberUserIds: [uid] })
      navigate(`/chat/${chat.id}`)
    } catch (e: any) { toast(e?.message ?? 'Could not open chat') }
  }

  if (loading || !user) return <Overlay title="Profile"><CenterSpinner /></Overlay>

  const online = isOnline(user.status)

  return (
    <Overlay title="">
      {/* gradient header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px 6px', textAlign: 'center' }}>
        <Avatar name={user.displayName} id={user.id} src={user.avatarUrl} size={96} online={online} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <span style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-.02em' }}>{user.displayName}</span>
          {user.premiumTier === 'Premium' && <CraftedObject id="s-gem" size={24} />}
        </div>
        <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>@{user.userName}</div>
        <div className={online ? '' : 'muted'} style={{ fontSize: 13, marginTop: 4, color: online ? 'var(--green)' : undefined }}>
          {online ? 'online' : lastSeen(user.lastSeenAt)}
        </div>
      </div>

      {/* action row */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '10px 16px 6px' }}>
        {ACTIONS.map((a) => (
          <button key={a.label} onClick={() => a.label === 'Message' ? void openChat() : a.label === 'Gift' ? navigate('/gifts') : toast(`${a.label} — coming soon`)}
            style={{ flex: 1, maxWidth: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', borderRadius: 14, border: '1px solid var(--hairline)', background: 'var(--surface)' }}>
            <CraftedObject id={a.sym} size={40} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* bio card */}
      {user.bio && (
        <div className="list-card" style={{ padding: '14px 16px' }}>
          <div className="section-label" style={{ padding: '0 0 4px' }}>Bio</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.5 }}>{user.bio}</div>
        </div>
      )}

      <div className="list-card">
        <div className="list-row" style={{ cursor: 'default' }}>
          <span className="lr-title grow">Mute notifications</span>
          <Switch on={muted} onChange={setMuted} />
        </div>
        <button className="list-row" onClick={() => toast('User blocked')}>
          <span className="lr-title grow" style={{ color: 'var(--danger)' }}>Block user</span>
        </button>
      </div>

      {/* gifts showcase */}
      {gifts.length > 0 && (
        <>
          <div className="section-label">Gifts · {gifts.length}</div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 16px 20px' }}>
            {gifts.map((g) => {
              const meta = giftByName(g.giftName)
              return (
                <div key={g.id} style={{ flex: '0 0 auto', width: 80, textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 16, display: 'grid', placeItems: 'center', background: meta ? `radial-gradient(120% 100% at 50% 18%, ${meta.g1}, ${meta.g2})` : 'var(--surface-2)' }}>
                    {meta ? <CraftedObject id={meta.sym} kind="gift" size={62} /> : <img src={g.giftImageUrl} width={50} height={50} alt="" />}
                  </div>
                  <div className="ellipsis" style={{ fontSize: 11.5, marginTop: 4 }}>{g.giftName}</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Overlay>
  )
}
