import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import { Modal, Spinner } from '../ui/primitives'
import { Avatar } from '../ui/Avatar'
import { CraftedObject } from '../ui/CraftedObject'
import { eventsApi } from '../lib/api'
import { useChat } from '../store/chat'
import { toast } from '../ui/toast'
import type { LoomEvent } from '../lib/types'

// Pick a chat to share an existing calendar event into (POST /events/{id}/share { chatId }).
export function ShareToChatModal({ event, onClose }: { event: LoomEvent; onClose: () => void }) {
  const chats = useChat((s) => s.chats)
  const loadChats = useChat((s) => s.loadChats)
  const upsertEvent = useChat((s) => s.upsertEvent)
  const [loading, setLoading] = useState(chats.length === 0)
  const [sharingId, setSharingId] = useState<number | null>(null)

  useEffect(() => {
    if (chats.length === 0) void loadChats().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const share = async (chatId: number, title: string) => {
    setSharingId(chatId)
    try {
      await eventsApi.share(event.id, chatId)
      // reflect into that chat's store; the live EventShared broadcast covers its members
      upsertEvent({ ...event, chatId })
      toast(`Shared to ${title}`)
      onClose()
    } catch (e: any) {
      toast(e?.status === 403 ? "You're not a member of that chat" : (e?.message ?? 'Could not share'))
    } finally { setSharingId(null) }
  }

  return (
    <Modal
      title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><CraftedObject id="s-calendar" size={22} /> Share “{event.title}”</span>}
      onClose={onClose}
    >
      {loading ? <div className="center-fill" style={{ height: 140 }}><Spinner /></div>
        : chats.length === 0 ? <div className="empty" style={{ height: 'auto', padding: 24 }}><div className="et">No chats</div><div>Start a chat first, then share this plan into it.</div></div>
          : <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {chats.map((c) => {
                const title = c.title || (c.type === 'Direct' ? 'Direct chat' : c.type)
                return (
                  <button key={c.id} className="list-row" style={{ borderRadius: 12, width: '100%' }} disabled={sharingId != null} onClick={() => void share(c.id, title)}>
                    <Avatar name={title} id={c.id} src={c.avatarUrl} size={44} />
                    <div className="grow" style={{ textAlign: 'left' }}>
                      <div className="lr-title">{title}</div>
                      <div className="lr-sub">{c.type}{c.membersCount ? ` · ${c.membersCount} members` : ''}</div>
                    </div>
                    <span style={{ color: 'var(--accent)' }}>{sharingId === c.id ? '…' : <Send size={18} />}</span>
                  </button>
                )
              })}
            </div>}
    </Modal>
  )
}
