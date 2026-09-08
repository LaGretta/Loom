import { useRef, useState } from 'react'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import { Search, PenSquare } from 'lucide-react'
import { useChat, previewText } from '../store/chat'
import { useNav } from '../store/nav'
import { useAuth } from '../store/auth'
import { Avatar } from '../ui/Avatar'
import { EmptyState, ErrorState, Button } from '../ui/primitives'
import { ChatListSkeleton } from '../ui/Skeleton'
import { chatListTime } from '../ui/format'
import { isOnline } from '../lib/enums'
import type { Chat } from '../lib/types'
import { ConversationView } from './ConversationView'
import { NewChatModal } from './NewChatModal'
import { MessageCircle } from 'lucide-react'

// Chat-list island width: design default 304, draggable within sane bounds, persisted.
const LIST_MIN = 260
const LIST_MAX = 460
const LIST_DEFAULT = 304
const GUTTER = 10                       // island inset from the frame edge
const clampW = (n: number) => Math.max(LIST_MIN, Math.min(LIST_MAX, n))
const readListWidth = () => {
  try {
    const v = Number(localStorage.getItem('loom.listWidth'))
    return Number.isFinite(v) && v >= LIST_MIN ? clampW(v) : LIST_DEFAULT
  } catch { return LIST_DEFAULT }
}

export function ChatsPage() {
  const { pathname } = useLocation()
  const match = useMatch('/chat/:id')
  const routeId = match?.params.id ? Number(match.params.id) : null
  // Overlay routes (/u/:id, /settings, /gifts …) render ON TOP of this screen. Keep the
  // conversation mounted underneath so closing the overlay drops straight back into it —
  // same scroll position, same draft, no refetch. Only the chats root clears it.
  const lastChatId = useRef<number | null>(null)
  if (routeId) lastChatId.current = routeId
  const activeId = routeId ?? (pathname === '/' ? null : lastChatId.current)

  const rowRef = useRef<HTMLDivElement>(null)
  const [listWidth, setListWidth] = useState(readListWidth)
  const [dragging, setDragging] = useState(false)

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault()
    setDragging(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    let latest = listWidth
    const move = (ev: PointerEvent) => {
      const rect = rowRef.current?.getBoundingClientRect()
      if (!rect) return
      // island starts at GUTTER from the pane's left edge
      latest = clampW(ev.clientX - rect.left - GUTTER)
      setListWidth(latest)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setDragging(false)
      try { localStorage.setItem('loom.listWidth', String(Math.round(latest))) } catch { /* ignore */ }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div className="pane chat-islands" ref={rowRef} style={{ flexDirection: 'row', height: '100%', '--list-w': `${listWidth}px` } as React.CSSProperties}>
      <div className={`list-col ${activeId ? 'hide-on-mobile' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <ChatListPane activeId={activeId} />
      </div>
      <div
        className={`col-resizer desktop-only ${dragging ? 'dragging' : ''}`}
        onPointerDown={startDrag}
        onDoubleClick={() => { setListWidth(LIST_DEFAULT); try { localStorage.setItem('loom.listWidth', String(LIST_DEFAULT)) } catch { /* ignore */ } }}
        title="Drag to resize · double-click to reset"
        role="separator"
        aria-orientation="vertical"
      />
      <div className={`main-col ${!activeId ? 'hide-on-mobile' : ''}`} style={{ display: 'flex' }}>
        {activeId
          ? <ConversationView chatId={activeId} />
          : <div className="desktop-only" style={{ flex: 1 }}>
              <EmptyState icon={<MessageCircle size={40} strokeWidth={1.4} />} title="Select a chat" subtitle="Choose a conversation to start messaging" />
            </div>}
      </div>
    </div>
  )
}

function ChatListPane({ activeId }: { activeId: number | null }) {
  const navigate = useNavigate()
  const openMenu = useNav((s) => s.openMenu)
  const chats = useChat((s) => s.chats)
  const loading = useChat((s) => s.chatsLoading)
  const error = useChat((s) => s.chatsError)
  const loadChats = useChat((s) => s.loadChats)
  const [q, setQ] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)

  const filtered = q.trim()
    ? chats.filter((c) => (c.title ?? '').toLowerCase().includes(q.toLowerCase()) || (c.lastMessage?.content ?? '').toLowerCase().includes(q.toLowerCase()))
    : chats

  return (
    <>
      {/* list-island header (desktop): burger + search + new-chat */}
      <div className="list-head desktop-only">
        <button className="burger-btn" title="Menu" aria-label="Open menu" onClick={openMenu}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="search search-inline">
          <Search size={16} />
          <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="icon-btn round" onClick={() => setComposeOpen(true)} title="New chat"><PenSquare size={19} /></button>
      </div>

      {/* header (mobile) */}
      <div className="m-head mobile-only">
        <button onClick={() => navigate('/profile')} style={{ border: 'none', background: 'transparent', padding: 0 }}>
          <Avatar name={useAuth.getState().me?.displayName ?? '?'} id={useAuth.getState().me?.id} src={useAuth.getState().me?.avatarUrl} size={40} />
        </button>
        <div className="m-title">Chats</div>
        <button className="icon-btn" onClick={() => setComposeOpen(true)}><PenSquare size={22} /></button>
      </div>

      <div className="search mobile-only">
        <Search size={17} />
        <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="pane-body" style={{ paddingBottom: 90 }}>
        {loading && chats.length === 0 ? <ChatListSkeleton />
          : error && chats.length === 0
            ? <ErrorState subtitle="We couldn’t reach the server." onRetry={() => void loadChats()} />
            : filtered.length === 0
              ? <EmptyState
                  icon={<MessageCircle size={38} strokeWidth={1.4} />}
                  title={q ? 'No matches' : 'No chats yet'}
                  subtitle={q ? 'Try a different search' : 'Start a conversation and it will show up here.'}
                  action={!q && <Button onClick={() => setComposeOpen(true)}>Start a chat</Button>}
                />
              : filtered.map((c, i) => (
              <ChatRow key={c.id} chat={c} active={c.id === activeId} index={i} onClick={() => navigate(`/chat/${c.id}`)} />
            ))}
      </div>

      {composeOpen && <NewChatModal onClose={() => setComposeOpen(false)} />}
    </>
  )
}

function ChatRow({ chat, active, index, onClick }: { chat: Chat; active: boolean; index: number; onClick: () => void }) {
  const presence = useChat((s) => s.presence)
  const typing = useChat((s) => s.typing[chat.id])
  const online = chat.type === 'Direct' && false // presence is per-user; direct-chat online resolved in convo. Keep dot subtle here.
  void presence; void online
  const title = chat.title || (chat.type === 'Direct' ? 'Direct chat' : chat.type)
  const isTyping = typing && typing.length > 0

  return (
    <div className={`chat-row row-in ${active ? 'active' : ''}`} style={{ animationDelay: `${Math.min(index, 12) * 0.03}s` }} onClick={onClick}>
      <Avatar name={title} id={chat.id} src={chat.avatarUrl} size={48} />
      <div className="col">
        <div className="r1">
          <span className="name ellipsis">{title}</span>
          <span className="time">{chatListTime(chat.lastMessage?.sentAt)}</span>
        </div>
        <div className="r2">
          <span className="preview ellipsis" style={isTyping ? { color: 'var(--accent)' } : undefined}>
            {isTyping ? 'typing…' : previewText(chat)}
          </span>
          {chat.unreadCount > 0 && <span className="badge">{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</span>}
        </div>
      </div>
    </div>
  )
}
