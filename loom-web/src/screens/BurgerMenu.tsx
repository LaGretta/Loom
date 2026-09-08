import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, UserPlus } from 'lucide-react'
import { useAuth } from '../store/auth'
import { Avatar } from '../ui/Avatar'
import { CraftedObject } from '../ui/CraftedObject'
import { starsApi } from '../lib/api'
import { fmtNumber } from '../ui/format'
import { toast } from '../ui/toast'

type NavKey = 'chats' | 'contacts' | 'calendar' | 'calls'

// Primary destinations, grouped island-style with dividers (see design §4).
const MAIN: { sym: string; label: string; to: string; key?: NavKey }[] = [
  { sym: 's-bubble', label: 'Chats', to: '/', key: 'chats' },
  { sym: 's-bookmark', label: 'Saved Messages', to: '/saved' },
  { sym: 's-coin', label: 'My Stars', to: '/stars' },
  { sym: 's-gift', label: 'Gifts', to: '/gifts' },
  { sym: 's-gem', label: 'Loom Premium', to: '/premium' },
  { sym: 's-person', label: 'Contacts', to: '/contacts', key: 'contacts' },
  { sym: 's-phone', label: 'Calls', to: '/calls', key: 'calls' },
  { sym: 's-calendar', label: 'Calendar', to: '/calendar', key: 'calendar' },
]
const PREFS: { sym: string; label: string; to: string }[] = [
  { sym: 's-gear', label: 'Settings', to: '/settings' },
  { sym: 's-paint', label: 'Appearance', to: '/settings/appearance' },
]

/**
 * Burger menu — sole entry point for profile + navigation (replaces the old icon rail).
 * Frosted island popover anchored under the burger button; capped height + scrollable.
 */
export function BurgerMenu({ onClose, activeTab }: { onClose: () => void; activeTab: NavKey | 'profile' | null }) {
  const navigate = useNavigate()
  const me = useAuth((s) => s.me)
  const logout = useAuth((s) => s.logout)
  const go = (to: string) => { onClose(); navigate(to) }
  const premiumActive = me?.premiumTier === 'Premium'
  const [stars, setStars] = useState<number | null>(null)

  // Real balance for the "My Stars" row (design §3 shows a right-hand value).
  useEffect(() => {
    let alive = true
    starsApi.balance().then((b) => { if (alive) setStars(b.balance) }).catch(() => { /* leave blank */ })
    return () => { alive = false }
  }, [])

  return (
    <div className="scrim burger-scrim anim-scrim" onMouseDown={onClose}>
      <div className="burger-menu anim-menu" onMouseDown={(e) => e.stopPropagation()}>
        {/* top section — profile → My Profile */}
        <button className="bm-profile" onClick={() => go('/profile')}>
          <Avatar name={me?.displayName ?? '?'} id={me?.id} src={me?.avatarUrl} size={42} />
          <div className="bm-id">
            <div className="bm-name ellipsis">{me?.displayName ?? 'You'}</div>
            <div className="bm-sub ellipsis">@{me?.userName ?? 'you'}</div>
          </div>
        </button>
        <button className="bm-item bm-muted" onClick={() => toast('Multi-account is coming soon')}>
          <span className="bm-ic"><UserPlus size={19} /></span>
          <span className="bm-label grow">Add account</span>
        </button>

        <div className="bm-div" />

        {/* primary destinations */}
        {MAIN.map((r) => (
          <button key={r.label} className={`bm-item ${r.key && activeTab === r.key ? 'active' : ''}`} onClick={() => go(r.to)}>
            <span className="bm-ic"><CraftedObject id={r.sym} size={26} /></span>
            <span className="bm-label grow">{r.label}</span>
            {r.label === 'My Stars' && stars != null && <span className="bm-val" style={{ color: 'var(--text)' }}>{fmtNumber(stars)}</span>}
            {r.label === 'Loom Premium' && premiumActive && <span className="bm-val" style={{ color: 'var(--success)' }}>Active</span>}
          </button>
        ))}

        <div className="bm-div" />

        {/* preferences */}
        {PREFS.map((r) => (
          <button key={r.label} className="bm-item" onClick={() => go(r.to)}>
            <span className="bm-ic"><CraftedObject id={r.sym} size={26} /></span>
            <span className="bm-label grow">{r.label}</span>
          </button>
        ))}

        <div className="bm-div" />
        <button className="bm-item bm-danger" onClick={() => { onClose(); void logout() }}>
          <span className="bm-ic"><LogOut size={19} /></span>
          <span className="bm-label grow">Log out</span>
        </button>
      </div>
    </div>
  )
}
