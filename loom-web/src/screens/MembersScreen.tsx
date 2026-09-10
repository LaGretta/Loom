import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Overlay } from '../ui/Overlay'
import { Avatar } from '../ui/Avatar'
import { Button, CenterSpinner, EmptyState, Switch } from '../ui/primitives'
import { chatsApi } from '../lib/api'
import { GroupInfoScreen } from './GroupInfoScreen'
import { useChat } from '../store/chat'
import { isOnline } from '../lib/enums'
import { presenceText } from '../ui/format'
import type { ChatMember } from '../lib/types'

const ChatMediaGallery = lazy(() => import('./ChatMediaGallery').then((m) => ({ default: m.ChatMediaGallery })))

export function MembersScreen() {
  const { id } = useParams()
  const chatId = Number(id)
  const navigate = useNavigate()
  const chat = useChat((s) => s.chats.find((c) => c.id === chatId))
  const loadChats = useChat((s) => s.loadChats)
  const [tried, setTried] = useState(false)
  // Distinguish "never had it" (deep link) from "had it and it went away" (left / deleted /
  // kicked): the second case is already navigating out, so don't re-fetch on the way.
  const everHad = useRef(!!chat)
  if (chat) everHad.current = true

  // myRole arrives with the chat DTO, so the list has to be there before we can decide
  // what this user may do. Fetch it once on a deep link / reload — and only once, so a
  // chat that is genuinely gone (left, deleted, kicked) doesn't loop.
  useEffect(() => {
    if (chat || tried || everHad.current) return
    setTried(true)
    void loadChats()
  }, [chat, tried, loadChats])

  if (!chat) {
    return (
      <Overlay title="Chat info">
        {tried
          ? <EmptyState title="Chat unavailable" subtitle="You’re no longer a member of this chat."
              action={<Button onClick={() => navigate('/', { replace: true })}>Back to chats</Button>} />
          : <CenterSpinner />}
      </Overlay>
    )
  }

  // Groups and channels get the full management screen; direct chats keep the simple one.
  return (
    <Overlay title={chat.type === 'Direct' ? 'Chat info' : `${chat.type} info`}>
      {chat.type === 'Direct'
        ? <DirectInfo chatId={chatId} />
        : <GroupInfoScreen chat={chat} />}
    </Overlay>
  )
}

/** Unchanged simple info screen for one-to-one chats. */
function DirectInfo({ chatId }: { chatId: number }) {
  const navigate = useNavigate()
  const presence = useChat((s) => s.presence)
  const chat = useChat((s) => s.chats.find((c) => c.id === chatId))
  const toggleMute = useChat((s) => s.toggleMute)
  const [members, setMembers] = useState<ChatMember[] | null>(null)

  useEffect(() => { chatsApi.members(chatId).then(setMembers).catch(() => setMembers([])) }, [chatId])

  return (
    <>
      <div className="section-label">Chat settings</div>
      <div className="list-card">
        <div className="list-row" style={{ cursor: 'default' }}>
          <span className="grow">
            <span className="lr-title">Mute notifications</span>
            <span className="lr-sub" style={{ display: 'block' }}>
              {chat?.isMuted ? 'No sound, no badge, no notifications' : 'You’ll be notified about new messages'}
            </span>
          </span>
          <Switch on={!!chat?.isMuted} onChange={() => void toggleMute(chatId)} label="Mute notifications" />
        </div>
      </div>

      <div className="section-label">Shared</div>
      <Suspense fallback={<CenterSpinner />}><ChatMediaGallery chatId={chatId} /></Suspense>

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
    </>
  )
}
