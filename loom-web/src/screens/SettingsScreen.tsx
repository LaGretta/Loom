import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Overlay } from '../ui/Overlay'
import { Avatar } from '../ui/Avatar'
import { CraftedObject } from '../ui/CraftedObject'
import { useAuth } from '../store/auth'
import { toast } from '../ui/toast'

const ROWS: { sym: string; label: string; to?: string }[] = [
  { sym: 's-paint', label: 'Appearance', to: '/settings/appearance' },
  { sym: 's-bell', label: 'Notifications' },
  { sym: 's-lock', label: 'Privacy & Security' },
  { sym: 's-drive', label: 'Data & Storage' },
  { sym: 's-globe', label: 'Language' },
  { sym: 's-help', label: 'Help' },
]

export function SettingsScreen() {
  const navigate = useNavigate()
  const me = useAuth((s) => s.me)

  return (
    <Overlay title="Settings">
      <button className="list-row" style={{ margin: '10px 16px', width: 'calc(100% - 32px)', borderRadius: 16, border: '1px solid var(--hairline)', padding: '14px 16px' }} onClick={() => navigate('/profile')}>
        <Avatar name={me?.displayName ?? '?'} id={me?.id} src={me?.avatarUrl} size={54} />
        <div className="grow" style={{ textAlign: 'left' }}>
          <div className="lr-title" style={{ fontSize: 17 }}>{me?.displayName}</div>
          <div className="lr-sub">@{me?.userName}</div>
        </div>
        <ChevronRight size={18} className="chev" />
      </button>

      <div className="list-card">
        {ROWS.map((r) => (
          <button key={r.label} className="list-row" onClick={() => r.to ? navigate(r.to) : toast(`${r.label} — coming soon`)}>
            <span className="obj-ic"><CraftedObject id={r.sym} size={34} /></span>
            <span className="lr-title grow">{r.label}</span>
            <ChevronRight size={18} className="chev" />
          </button>
        ))}
      </div>
      <div className="muted" style={{ textAlign: 'center', fontSize: 12.5, padding: 12 }}>Loom · v1.0.0</div>
    </Overlay>
  )
}
