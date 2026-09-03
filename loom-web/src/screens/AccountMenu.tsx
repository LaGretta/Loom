import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut } from 'lucide-react'
import { useAuth } from '../store/auth'
import { Avatar } from '../ui/Avatar'
import { CraftedObject } from '../ui/CraftedObject'
import { ACCOUNT_ROWS } from './account-rows'

// Desktop popover anchored above the rail avatar.
export function AccountMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const me = useAuth((s) => s.me)
  const logout = useAuth((s) => s.logout)
  const go = (to: string) => { onClose(); navigate(to) }

  return (
    <div className="scrim" style={{ background: 'transparent', alignItems: 'flex-end', justifyContent: 'flex-start' }} onMouseDown={onClose}>
      <div className="anim-menu" onMouseDown={(e) => e.stopPropagation()}
        style={{ position: 'absolute', left: 74, bottom: 14, width: 264, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <button className="list-row" onClick={() => go('/profile')} style={{ padding: '14px 16px' }}>
          <Avatar name={me?.displayName ?? '?'} id={me?.id} src={me?.avatarUrl} size={44} />
          <div className="grow" style={{ textAlign: 'left' }}>
            <div className="lr-title">{me?.displayName}</div>
            <div className="lr-sub">@{me?.userName}</div>
          </div>
        </button>
        <div className="divider" />
        <button className="list-row" onClick={() => go('/profile')}>
          <span className="obj-ic"><CraftedObject id="s-person" size={30} /></span>
          <span className="lr-title grow">My Profile</span>
          <ChevronRight size={17} className="chev" />
        </button>
        {ACCOUNT_ROWS.map((r) => (
          <button key={r.label} className="list-row" onClick={() => go(r.to)}>
            <span className="obj-ic"><CraftedObject id={r.sym} size={30} /></span>
            <span className="lr-title grow">{r.label}</span>
            <ChevronRight size={17} className="chev" />
          </button>
        ))}
        <div className="divider" />
        <button className="list-row" onClick={() => { onClose(); void logout() }}>
          <span className="obj-ic" style={{ color: 'var(--danger)' }}><LogOut size={20} /></span>
          <span className="lr-title grow" style={{ color: 'var(--danger)' }}>Log out</span>
        </button>
      </div>
    </div>
  )
}
