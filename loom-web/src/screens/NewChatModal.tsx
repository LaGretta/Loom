import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Check } from 'lucide-react'
import { Modal, Button, Segmented, Spinner } from '../ui/primitives'
import { Avatar } from '../ui/Avatar'
import { usersApi, chatsApi } from '../lib/api'
import { useChat } from '../store/chat'
import { toast } from '../ui/toast'
import type { UserSummary } from '../lib/types'
import type { ChatType } from '../lib/enums'
import { isOnline } from '../lib/enums'

export function NewChatModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const loadChats = useChat((s) => s.loadChats)
  const [type, setType] = useState<ChatType>('Direct')
  const [q, setQ] = useState('')
  const [results, setResults] = useState<UserSummary[]>([])
  const [selected, setSelected] = useState<UserSummary[]>([])
  const [title, setTitle] = useState('')
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)

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

  const toggle = (u: UserSummary) => {
    if (type === 'Direct') { setSelected([u]); return }
    setSelected((s) => s.some((x) => x.id === u.id) ? s.filter((x) => x.id !== u.id) : [...s, u])
  }

  const create = async () => {
    if (selected.length === 0) { toast('Select at least one person'); return }
    if (type !== 'Direct' && !title.trim()) { toast('Enter a name'); return }
    setBusy(true)
    try {
      const chat = await chatsApi.create({
        type,
        title: type === 'Direct' ? null : title.trim(),
        memberUserIds: selected.map((u) => u.id),
      })
      await loadChats()
      onClose()
      navigate(`/chat/${chat.id}`)
    } catch (e: any) {
      toast(e?.message ?? 'Could not create chat')
    } finally { setBusy(false) }
  }

  return (
    <Modal title="New chat" onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => void create()} disabled={busy || selected.length === 0}>{busy ? 'Creating…' : type === 'Direct' ? 'Start chat' : `Create ${type.toLowerCase()}`}</Button></>}>
      <div style={{ marginBottom: 14 }}>
        <Segmented<ChatType>
          value={type}
          onChange={(v) => { setType(v); setSelected([]) }}
          options={[{ value: 'Direct', label: 'Direct' }, { value: 'Group', label: 'Group' }, { value: 'Channel', label: 'Channel' }]}
        />
      </div>

      {type !== 'Direct' && (
        <input className="input" placeholder={`${type} name`} value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: 12 }} />
      )}

      {selected.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {selected.map((u) => (
            <span key={u.id} className="chip on" onClick={() => toggle(u)} style={{ cursor: 'pointer' }}>{u.displayName} ✕</span>
          ))}
        </div>
      )}

      <div className="search" style={{ margin: '0 0 10px' }}>
        <Search size={17} />
        <input placeholder="Search people" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      </div>

      <div style={{ minHeight: 120 }}>
        {searching ? <div className="center-fill" style={{ height: 120 }}><Spinner /></div>
          : results.map((u) => {
            const on = selected.some((x) => x.id === u.id)
            return (
              <button key={u.id} className="list-row" style={{ borderRadius: 12 }} onClick={() => toggle(u)}>
                <Avatar name={u.displayName} id={u.id} src={u.avatarUrl} size={44} online={isOnline(u.status)} />
                <div className="grow" style={{ textAlign: 'left' }}>
                  <div className="lr-title">{u.displayName}</div>
                  <div className="lr-sub">@{u.userName}</div>
                </div>
                {on && <span style={{ color: 'var(--accent)' }}><Check size={20} /></span>}
              </button>
            )
          })}
        {!searching && q && results.length === 0 && <div className="muted" style={{ textAlign: 'center', padding: 20, fontSize: 14 }}>No people found</div>}
        {!q && <div className="muted" style={{ textAlign: 'center', padding: 20, fontSize: 14 }}>Search for people to start a chat</div>}
      </div>
    </Modal>
  )
}
