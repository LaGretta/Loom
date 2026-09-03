import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut } from 'lucide-react'
import { CraftedObject } from '../ui/CraftedObject'
import { useAuth } from '../store/auth'

export const ACCOUNT_ROWS: { sym: string; label: string; to: string }[] = [
  { sym: 's-coin', label: 'My Stars', to: '/stars' },
  { sym: 's-gift', label: 'Gifts', to: '/gifts' },
  { sym: 's-gem', label: 'Loom Premium', to: '/premium' },
  { sym: 's-bookmark', label: 'Saved', to: '/saved' },
  { sym: 's-gear', label: 'Settings', to: '/settings' },
]

export function AccountRows({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const logout = useAuth((s) => s.logout)
  const go = (to: string) => { onNavigate?.(); navigate(to) }

  return (
    <div className="list-card" style={{ margin: '0 16px 16px' }}>
      {ACCOUNT_ROWS.map((r) => (
        <button key={r.label} className="list-row" onClick={() => go(r.to)}>
          <span className="obj-ic"><CraftedObject id={r.sym} size={34} /></span>
          <span className="lr-title grow">{r.label}</span>
          <ChevronRight size={18} className="chev" />
        </button>
      ))}
      <button className="list-row" onClick={() => { onNavigate?.(); void logout() }}>
        <span className="obj-ic" style={{ color: 'var(--danger)' }}><LogOut size={22} /></span>
        <span className="lr-title grow" style={{ color: 'var(--danger)' }}>Log out</span>
      </button>
    </div>
  )
}
