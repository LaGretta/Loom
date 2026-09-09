import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Send } from 'lucide-react'
import { Modal, Button, EmptyState } from '../ui/primitives'
import { Avatar } from '../ui/Avatar'
import { useChat } from '../store/chat'
import { toast } from '../ui/toast'
import type { Message } from '../lib/types'

/** Pick one chat to forward a message into, then jump to that chat. */
export function ForwardModal({ message, onClose }: { message: Message; onClose: () => void }) {
  const navigate = useNavigate()
  const chats = useChat((s) => s.chats)
  const forwardMessage = useChat((s) => s.forwardMessage)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return chats
      .filter((c) => c.id !== message.chatId)                  // forwarding into the same chat is pointless
      .filter((c) => !term || (c.title ?? '').toLowerCase().includes(term))
  }, [chats, q, message.chatId])

  const go = async () => {
    if (picked == null || busy) return
    setBusy(true)
    const sent = await forwardMessage(message.id, picked)
    setBusy(false)
    if (!sent) return
    toast('Forwarded')
    onClose()
    navigate(`/chat/${picked}`)
  }

  return (
    <Modal title="Forward to…" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => void go()} disabled={picked == null || busy}>
          <Send size={16} /> {busy ? 'Sending…' : 'Forward'}
        </Button>
      </>}>
      <div className="search" style={{ margin: '0 0 10px' }}>
        <Search size={17} />
        <input placeholder="Search chats" aria-label="Search chats" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {list.length === 0
          ? <EmptyState title="No other chats" subtitle="Start another conversation to forward into it." />
          : list.map((c) => (
            <button key={c.id} className={`chat-row ${picked === c.id ? 'active' : ''}`}
              onClick={() => setPicked(c.id)} style={{ width: '100%' }}>
              <Avatar name={c.title ?? 'Chat'} id={c.id} src={c.avatarUrl} size={42} />
              <div className="col" style={{ textAlign: 'left' }}>
                <div className="name ellipsis">{c.title ?? 'Chat'}</div>
              </div>
            </button>
          ))}
      </div>
    </Modal>
  )
}
