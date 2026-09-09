import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Overlay } from '../ui/Overlay'
import { Avatar } from '../ui/Avatar'
import { CenterSpinner, Switch } from '../ui/primitives'
import { chatsApi } from '../lib/api'
import { ChatMediaGallery } from './ChatMediaGallery'
import { useChat } from '../store/chat'
import { isOnline } from '../lib/enums'
import { presenceText } from '../ui/format'
import type { ChatMember } from '../lib/types'

export function MembersScreen() {
  const { id } = useParams()
  const chatId = Number(id)
  const navigate = useNavigate()
  const presence = useChat((s) => s.presence)
  const chat = useChat((s) => s.chats.find((c) => c.id === chatId))
  const toggleMute = useChat((s) => s.toggleMute)
  const [members, setMembers] = useState<ChatMember[] | null>(null)

  useEffect(() => { chatsApi.members(chatId).then(setMembers).catch(() => setMembers([])) }, [chatId])

  return (
    <Overlay title="Chat info">
      {/* chat settings */}
      <div className="section-label">Chat settings</div>
      <div className="list-card">
        <div className="list-row" style={{ cursor: 'default' }}>
          <span className="grow">
            <span className="lr-title">Mute notifications</span>
            <span className="lr-sub" style={{ display: 'block' }}>
              {chat?.isMuted ? 'No sound, no badge, no notifications' : 'You’ll be notified about new messages'}
            </span>
          </span>
          <Switch on={!!chat?.isMuted} onChange={() => void toggleMute(chatId)} />
        </div>
      </div>

      <div className="section-label">Shared</div>
      <ChatMediaGallery chatId={chatId} />

      <div className="section-label">Members{members ? ` · ${members.length}` : ''}</div>
      {!members ? <CenterSpinner /> : (
        <div className="list-card">
          {members.map((m) => {
            const live = presence[m.userId]
            const online = live?.online ?? isOnline(m.status)
            return (
              <button key={m.userId} className="list-row" onClick={() => navigate(`/u/${m.userId}`)}>
                <Avatar name={m.displayName} id={m.userId} src={m.avatarUrl} size={46} online={online} />
                <div className="grow" style={{ textAlign: 'left' }}>
                  <div className="lr-title">{m.displayName}</div>
                  <div className={`lr-sub ${online ? 'online' : ''}`}>{presenceText(m.status, null, live)}</div>
                </div>
                {m.role !== 'Member' && <span className="chip" style={{ padding: '3px 10px', fontSize: 11 }}>{m.role}</span>}
              </button>
            )
          })}
        </div>
      )}
    </Overlay>
  )
}
