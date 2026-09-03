import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MessageSquare, UserPlus } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { EmptyState, Spinner } from '../ui/primitives'
import { usersApi, chatsApi } from '../lib/api'
import { isOnline } from '../lib/enums'
import { toast } from '../ui/toast'
import type { UserSummary } from '../lib/types'

export function ContactsPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<UserSummary[]>([])
  const [searching, setSearching] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    let alive = true
    const t = setTimeout(async () => {
      if (!q.trim()) { setResults([]); return }
      setSearching(true); setTouched(true)
      try { const r = await usersApi.search(q.trim()); if (alive) setResults(r) } catch { /* ignore */ }
      finally { if (alive) setSearching(false) }
    }, 300)
    return () => { alive = false; clearTimeout(t) }
  }, [q])

  const groups = useMemo(() => {
    const map = new Map<string, UserSummary[]>()
    for (const u of [...results].sort((a, b) => a.displayName.localeCompare(b.displayName))) {
      const k = (u.displayName[0] || '#').toUpperCase()
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(u)
    }
    return [...map.entries()]
  }, [results])

  const message = async (u: UserSummary) => {
    try { const chat = await chatsApi.create({ type: 'Direct', memberUserIds: [u.id] }); navigate(`/chat/${chat.id}`) }
    catch (e: any) { toast(e?.message ?? 'Could not start chat') }
  }

  return (
    <div className="pane" style={{ height: '100%' }}>
      <div className="pane-head">
        <div className="pane-title">Contacts</div>
        <button className="icon-btn" onClick={() => toast('Add contact — search below')}><UserPlus size={20} /></button>
      </div>
      <div className="search"><Search size={17} /><input placeholder="Search people" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="pane-body" style={{ paddingBottom: 100 }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          {searching ? <div className="center-fill" style={{ height: 160 }}><Spinner /></div>
            : !touched ? <EmptyState icon={<Search size={38} strokeWidth={1.4} />} title="Find people" subtitle="Search by name or @username to start a conversation" />
              : results.length === 0 ? <EmptyState title="No people found" subtitle="Try a different search" />
                : groups.map(([letter, users]) => (
                  <div key={letter}>
                    <div className="section-label" style={{ padding: '10px 16px 4px' }}>{letter}</div>
                    {users.map((u) => (
                      <div key={u.id} className="chat-row" onClick={() => navigate(`/u/${u.id}`)}>
                        <Avatar name={u.displayName} id={u.id} src={u.avatarUrl} size={46} online={isOnline(u.status)} />
                        <div className="col">
                          <div className="name">{u.displayName}</div>
                          <div className="preview">@{u.userName}</div>
                        </div>
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); void message(u) }}><MessageSquare size={18} /></button>
                      </div>
                    ))}
                  </div>
                ))}
        </div>
      </div>
    </div>
  )
}
