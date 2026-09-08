import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Plus } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { CraftedObject } from '../ui/CraftedObject'
import { EmptyState } from '../ui/primitives'
import { useMock } from '../store/mock'
import { toast } from '../ui/toast'

// Calls history has NO backend endpoint yet. The list stays genuinely empty until one
// exists — we never seed invented call entries. // TODO(backend): calls history endpoint
export function CallsPage() {
  const calls = useMock((s) => s.calls)

  return (
    <div className="pane" style={{ height: '100%' }}>
      <div className="pane-head">
        <div className="pane-title">Calls</div>
        <button className="icon-btn" onClick={() => toast('New call — coming soon')} aria-label="New call"><Plus size={20} /></button>
      </div>
      <div className="pane-body" style={{ paddingBottom: 100 }}>
        {calls.length === 0 ? (
          <EmptyState
            icon={<CraftedObject id="s-phone" size={72} />}
            title="No calls yet"
            subtitle="Voice and video calls aren’t available yet — your call history will appear here once they are."
          />
        ) : (
          <div style={{ maxWidth: 620, margin: '0 auto' }}>
            <div className="list-card" style={{ marginTop: 12 }}>
              {calls.map((c) => {
                const Dir = c.direction === 'incoming' ? PhoneIncoming : c.direction === 'outgoing' ? PhoneOutgoing : PhoneMissed
                const missed = c.direction === 'missed'
                return (
                  <div key={c.id} className="list-row" style={{ cursor: 'default' }}>
                    <Avatar name={c.name} id={c.name} size={46} />
                    <div className="grow">
                      <div className="lr-title" style={{ color: missed ? 'var(--danger)' : undefined }}>{c.name}</div>
                      <div className="lr-sub" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Dir size={13} /> {c.direction} · {new Date(c.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className="obj-ic"><CraftedObject id={c.video ? 's-video' : 's-phone'} size={30} /></span>
                    <button className="icon-btn" onClick={() => toast('Calling — coming soon')} aria-label="Call"><Phone size={18} /></button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
