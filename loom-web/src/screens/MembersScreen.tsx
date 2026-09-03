import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Overlay } from '../ui/Overlay'
import { Avatar } from '../ui/Avatar'
import { CenterSpinner } from '../ui/primitives'
import { chatsApi } from '../lib/api'
import { useChat } from '../store/chat'
import { isOnline } from '../lib/enums'
import type { ChatMember } from '../lib/types'

export function MembersScreen() {
  const { id } = useParams()
  const chatId = Number(id)
  const navigate = useNavigate()
  const presence = useChat((s) => s.presence)
  const [members, setMembers] = useState<ChatMember[] | null>(null)

  useEffect(() => { chatsApi.members(chatId).then(setMembers).catch(() => setMembers([])) }, [chatId])

  return (
    <Overlay title={`Members${members ? ` · ${members.length}` : ''}`}>
      {!members ? <CenterSpinner /> : (
        <div className="list-card" style={{ marginTop: 12 }}>
          {members.map((m) => {
            const online = presence[m.userId]?.online ?? isOnline(m.status)
            return (
              <button key={m.userId} className="list-row" onClick={() => navigate(`/u/${m.userId}`)}>
                <Avatar name={m.displayName} id={m.userId} src={m.avatarUrl} size={46} online={online} />
                <div className="grow" style={{ textAlign: 'left' }}>
                  <div className="lr-title">{m.displayName}</div>
                  <div className="lr-sub">@{m.userName}</div>
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
