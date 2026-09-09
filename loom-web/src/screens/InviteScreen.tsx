import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Overlay } from '../ui/Overlay'
import { CenterSpinner } from '../ui/primitives'
import { useChat } from '../store/chat'
import { InvitePanel } from './InvitePanel'

/**
 * Standalone invite overlay (/chat/:id/invite) so "Invite" is one tap from the chat
 * header. The same panel also lives inside group management.
 */
export function InviteScreen() {
  const { id } = useParams()
  const chatId = Number(id)
  const navigate = useNavigate()
  const chat = useChat((s) => s.chats.find((c) => c.id === chatId))

  const allowed = !!chat && chat.type !== 'Direct' && (chat.myRole === 'Owner' || chat.myRole === 'Admin')

  // Roles can change between opening the header and landing here; don't show a panel
  // whose every request would be refused.
  useEffect(() => { if (chat && !allowed) navigate(`/chat/${chatId}`, { replace: true }) }, [chat, allowed, chatId, navigate])

  return (
    <Overlay title="Invite people">
      {allowed && chat
        ? <InvitePanel chatId={chatId} chatTitle={chat.title || 'this chat'} />
        : <CenterSpinner />}
    </Overlay>
  )
}
