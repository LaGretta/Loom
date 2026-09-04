import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Phone, Video, Search, MoreVertical, CheckCheck, Check } from 'lucide-react'
import { useChat } from '../store/chat'
import { useAuth } from '../store/auth'
import { chatsApi } from '../lib/api'
import { Avatar } from '../ui/Avatar'
import { CenterSpinner } from '../ui/primitives'
import { CraftedObject } from '../ui/CraftedObject'
import { giftByName } from '../assets/loom'
import { Wallpaper } from '../ui/Wallpaper'
import { timeShort, dayLabel, fileSize } from '../ui/format'
import { isOnline, type UserStatus } from '../lib/enums'
import type { Chat, ChatMember, Message, LoomEvent } from '../lib/types'
import { Composer, MessageContextMenu } from './conversation-parts'
import { EventCard } from '../components/EventCard'
import { toast } from '../ui/toast'

export function ConversationView({ chatId }: { chatId: number }) {
  const navigate = useNavigate()
  const me = useAuth((s) => s.me)
  const chats = useChat((s) => s.chats)
  const messages = useChat((s) => s.messages[chatId])
  const events = useChat((s) => s.events[chatId])
  const loading = useChat((s) => s.msgLoading[chatId])
  const typing = useChat((s) => s.typing[chatId])
  const presence = useChat((s) => s.presence)
  const openChat = useChat((s) => s.openChat)
  const closeChat = useChat((s) => s.closeChat)
  const loadMore = useChat((s) => s.loadMore)
  const hasMore = useChat((s) => s.msgHasMore[chatId])

  const [chat, setChat] = useState<Chat | null>(null)
  const [members, setMembers] = useState<ChatMember[]>([])
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editing, setEditing] = useState<Message | null>(null)
  const [menuFor, setMenuFor] = useState<Message | null>(null)

  const threadRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLen = useRef(0)

  useEffect(() => {
    void openChat(chatId)
    return () => closeChat(chatId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  useEffect(() => {
    const inList = chats.find((c) => c.id === chatId)
    if (inList) setChat(inList)
    else chatsApi.byId(chatId).then(setChat).catch(() => {})
    chatsApi.members(chatId).then(setMembers).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  // auto-scroll to bottom on new messages (if near bottom)
  useLayoutEffect(() => {
    const el = threadRef.current
    if (!el) return
    const len = messages?.length ?? 0
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 240
    if (len > prevLen.current && (nearBottom || prevLen.current === 0)) {
      bottomRef.current?.scrollIntoView({ behavior: prevLen.current === 0 ? 'auto' : 'smooth' })
    }
    prevLen.current = len
  }, [messages])

  const other = useMemo(() => members.find((m) => m.userId !== me?.id), [members, me])
  const isDirect = chat?.type === 'Direct'
  const title = chat?.title || other?.displayName || (chat?.type === 'Direct' ? 'Direct chat' : chat?.type ?? 'Chat')

  const status: { text: string; online: boolean } = useMemo(() => {
    if (isDirect && other) {
      const p = presence[other.userId]
      const online = p ? p.online : isOnline(other.status as UserStatus)
      return { text: online ? 'online' : 'last seen recently', online }
    }
    const onlineCount = members.filter((m) => (presence[m.userId]?.online ?? isOnline(m.status as UserStatus))).length
    return { text: `${chat?.membersCount ?? members.length} members${onlineCount ? `, ${onlineCount} online` : ''}`, online: false }
  }, [isDirect, other, presence, members, chat])

  const onScroll = () => {
    const el = threadRef.current
    if (el && el.scrollTop < 80 && hasMore) {
      const prevH = el.scrollHeight
      void loadMore(chatId).then(() => {
        requestAnimationFrame(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight - prevH })
      })
    }
  }

  const grouped = useMemo(() => buildTimeline(messages ?? [], events ?? []), [messages, events])
  // Resolve sender name/avatar from the members list when a message DTO lacks them
  // (e.g. live-broadcast messages whose senderName can come back empty).
  const memberById = useMemo(() => {
    const m = new Map<number, ChatMember>()
    for (const mm of members) m.set(mm.userId, mm)
    return m
  }, [members])

  return (
    <div className="pane" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
      {/* header */}
      <div className="chat-header frost">
        <button className="icon-btn mobile-only" onClick={() => navigate('/')}><ChevronLeft size={24} /></button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: 0, flex: 1, minWidth: 0, textAlign: 'left' }}
          onClick={() => { if (isDirect && other) navigate(`/u/${other.userId}`); else navigate(`/chat/${chatId}/members`) }}>
          <Avatar name={title} id={isDirect ? (other?.userId ?? chatId) : chatId} src={isDirect ? (other?.avatarUrl ?? chat?.avatarUrl) : chat?.avatarUrl} size={42} online={status.online} />
          <div style={{ minWidth: 0 }}>
            <div className="h-name ellipsis">{title}</div>
            <div className={`h-status ellipsis ${status.online ? 'online' : ''}`}>
              {typing && typing.length > 0 ? 'typing…' : status.text}
            </div>
          </div>
        </button>
        <div className="h-actions">
          <button className="icon-btn desktop-only" onClick={() => toast('Voice call — coming soon')}><Phone size={19} /></button>
          <button className="icon-btn" onClick={() => toast('Video call — coming soon')}><Video size={19} /></button>
          <button className="icon-btn desktop-only" onClick={() => toast('In-chat search — coming soon')}><Search size={19} /></button>
          <button className="icon-btn" onClick={() => navigate(`/chat/${chatId}/members`)}><MoreVertical size={19} /></button>
        </div>
      </div>

      {/* thread + wallpaper */}
      <div className="thread-wrap">
        <Wallpaper />
        <div className="thread" ref={threadRef} onScroll={onScroll}>
          <div className="thread-inner">
            {loading && !messages ? <CenterSpinner />
              : grouped.length === 0
                ? <div className="day-pill" style={{ marginTop: 40 }}>No messages yet — say hi 👋</div>
                : grouped.map((g) => (
                  g.kind === 'day'
                    ? <div key={g.key} className="day-pill">{g.label}</div>
                    : g.kind === 'event'
                      ? <div key={`ev-${g.event.id}`} className="event-row"><EventCard event={g.event} /></div>
                      : <Bubble
                          key={g.message.id}
                          message={g.message}
                          mine={g.message.senderId === me?.id}
                          showSender={!isDirect && g.showSender}
                          grouped={g.grouped}
                          senderName={g.message.senderName || memberById.get(g.message.senderId)?.displayName || 'Member'}
                          senderAvatarUrl={g.message.senderAvatarUrl ?? memberById.get(g.message.senderId)?.avatarUrl}
                          onReply={() => { setEditing(null); setReplyTo(g.message) }}
                          onMenu={() => setMenuFor(g.message)}
                          onOpenProfile={() => navigate(`/u/${g.message.senderId}`)}
                        />
                ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      <Composer
        chatId={chatId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
      />

      {menuFor && (
        <MessageContextMenu
          message={menuFor}
          mine={menuFor.senderId === me?.id}
          onClose={() => setMenuFor(null)}
          onReply={() => { setEditing(null); setReplyTo(menuFor) }}
          onEdit={() => { setReplyTo(null); setEditing(menuFor) }}
        />
      )}
    </div>
  )
}

/* Clickable sender avatar (group chats) → opens the sender's profile. */
function SenderAvatar({ name, id, src, onClick }: { name: string; id: number; src?: string | null; onClick: () => void }) {
  return (
    <span
      className="msg-sender-av"
      style={{ cursor: 'pointer', alignSelf: 'flex-end' }}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      role="button"
      aria-label={`Open ${name}'s profile`}
    >
      <Avatar name={name} id={id} src={src} size={30} />
    </span>
  )
}

/* Gift-type message → rendered as a gift card (crafted 3D object by name), not plain text. */
function GiftBubbleCard({ giftName, mine, senderName }: { giftName: string; mine: boolean; senderName: string }) {
  const meta = giftByName(giftName)
  const backdrop = meta ? `radial-gradient(120% 100% at 50% 18%, ${meta.g1}, ${meta.g2})` : 'var(--surface-2)'
  const legendary = meta?.r === 'LEGENDARY'
  return (
    <div style={{ width: 224 }}>
      <div style={{ position: 'relative', height: 124, borderRadius: 12, overflow: 'hidden', display: 'grid', placeItems: 'center', background: backdrop, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18), inset 0 -14px 26px rgba(0,0,0,.22)' }}>
        {meta ? <CraftedObject id={meta.sym} kind="gift" size={92} /> : <CraftedObject id="s-gift" size={72} />}
        {meta && <span className={`rarity ${legendary ? 'legendary' : 'other'}`} style={{ position: 'absolute', top: 8, left: 8 }}>{meta.r}</span>}
      </div>
      <div style={{ padding: '9px 2px 0' }}>
        <div style={{ fontSize: 11.5, color: mine ? 'inherit' : 'var(--text-2)', opacity: mine ? .7 : 1 }}>
          {mine ? 'You sent a gift 🎁' : `${senderName} sent you a gift 🎁`}
        </div>
        <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-.015em', marginTop: 2 }}>{giftName}</div>
      </div>
    </div>
  )
}

/* ---------------- Bubble ---------------- */
function Bubble({ message, mine, showSender, grouped, senderName, senderAvatarUrl, onReply, onMenu, onOpenProfile }: {
  message: Message
  mine: boolean
  showSender: boolean
  grouped: boolean
  senderName: string          // resolved (message.senderName, falling back to member list)
  senderAvatarUrl?: string | null
  onReply: () => void
  onMenu: () => void
  onOpenProfile: () => void   // tap sender avatar/name → open their profile
}) {
  const react = useChat((s) => s.react)
  const pressTimer = useRef<number>()

  // Stickers render large, no bubble
  if (message.type === 'Sticker' && !message.isDeleted) {
    return (
      <div className={`msg-row ${mine ? 'out' : ''} ${grouped ? 'grouped' : ''}`} onContextMenu={(e) => { e.preventDefault(); onMenu() }}>
        {!mine && showSender ? <SenderAvatar name={senderName} id={message.senderId} src={senderAvatarUrl} onClick={onOpenProfile} /> : (!mine ? <span style={{ width: 30, flex: '0 0 30px' }} /> : null)}
        <div style={{ position: 'relative' }} onDoubleClick={onReply}>
          {!mine && showSender && <div className="sender" style={{ color: 'var(--accent)', cursor: 'pointer', marginBottom: 3 }} onClick={onOpenProfile}>{senderName}</div>}
          <CraftedObject id={message.content} kind="sticker" size={128} />
          {message.reactions.length > 0 && <ReactionRow message={message} mine={mine} onToggle={(e) => react(message.id, message.chatId, e)} />}
        </div>
      </div>
    )
  }

  const isImage = message.type === 'Image'
  const isFile = message.type === 'File' || message.type === 'Video'
  const isGift = message.type === 'Gift' && !message.isDeleted

  const startPress = () => { pressTimer.current = window.setTimeout(onMenu, 480) }
  const endPress = () => window.clearTimeout(pressTimer.current)

  return (
    <div className={`msg-row ${mine ? 'out' : ''} ${grouped ? 'grouped' : ''} anim-pop`}
      onContextMenu={(e) => { e.preventDefault(); onMenu() }}>
      {!mine && showSender ? <SenderAvatar name={senderName} id={message.senderId} src={senderAvatarUrl} onClick={onOpenProfile} /> : (!mine ? <span style={{ width: 30, flex: '0 0 30px' }} /> : null)}
      <div className="bubble" onMouseDown={startPress} onMouseUp={endPress} onMouseLeave={endPress} onTouchStart={startPress} onTouchEnd={endPress} onDoubleClick={onReply}>
        {!mine && showSender && <div className="sender" style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={onOpenProfile}>{senderName}</div>}
        {message.replyToPreview && (
          <div className="reply-quote">
            <div className="qt ellipsis">{message.replyToPreview}</div>
          </div>
        )}
        {message.isDeleted
          ? <div className="text" style={{ fontStyle: 'italic', opacity: .5 }}>Message deleted</div>
          : isGift
            ? <GiftBubbleCard giftName={message.content} mine={mine} senderName={senderName} />
            : isImage
            ? <div className="card-photo"><img src={message.content} alt="" loading="lazy" /></div>
            : isFile
              ? <a className="card-file" href={message.content} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                  <span className="file-ic"><Check size={20} /></span>
                  <span><div className="fn ellipsis" style={{ maxWidth: 180 }}>{fileNameFromUrl(message.content)}</div><div className="fs">{message.type === 'Video' ? 'Video' : 'File'}</div></span>
                </a>
              : <div className="text">{message.content}</div>}

        <div className="foot">
          {message.isEdited && !message.isDeleted && <span className="edited">edited</span>}
          <span className="time">{timeShort(message.sentAt)}</span>
          {mine && !message.isDeleted && (
            <span className="ticks">{message.status === 'Read' ? <CheckCheck size={15} /> : message.status === 'Delivered' ? <CheckCheck size={15} style={{ opacity: .6 }} /> : <Check size={15} style={{ opacity: .6 }} />}</span>
          )}
        </div>

        {message.reactions.length > 0 && <ReactionRow message={message} mine={mine} onToggle={(e) => react(message.id, message.chatId, e)} />}
      </div>
    </div>
  )
}

function ReactionRow({ message, mine, onToggle }: { message: Message; mine: boolean; onToggle: (emoji: string) => void }) {
  return (
    <div className="reactions">
      {message.reactions.map((r) => (
        <button key={r.emoji} className={`react-pill anim-pop ${r.reactedByMe ? 'mine' : ''}`} onClick={() => onToggle(r.emoji)}>
          <span>{r.emoji}</span><span>{r.count}</span>
        </button>
      ))}
      {void mine}
    </div>
  )
}

/* ---------------- grouping ---------------- */
type Group =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'msg'; message: Message; showSender: boolean; grouped: boolean }
  | { kind: 'event'; event: LoomEvent }

// Merge messages + shared event cards into one time-ordered timeline with day dividers.
function buildTimeline(messages: Message[], events: LoomEvent[]): Group[] {
  type Item = { at: number; iso: string } & ({ t: 'msg'; m: Message } | { t: 'event'; e: LoomEvent })
  const items: Item[] = [
    ...messages.map((m) => ({ at: new Date(m.sentAt).getTime(), iso: m.sentAt, t: 'msg' as const, m })),
    ...events.map((e) => ({ at: new Date(e.createdAt).getTime(), iso: e.createdAt, t: 'event' as const, e })),
  ].sort((a, b) => a.at - b.at)

  const out: Group[] = []
  let lastDay = ''
  let lastSender = -1
  let lastTime = 0
  for (const it of items) {
    const dayKey = new Date(it.iso).toDateString()
    if (dayKey !== lastDay) {
      out.push({ kind: 'day', key: dayKey + it.at, label: dayLabel(it.iso) })
      lastDay = dayKey
      lastSender = -1
    }
    if (it.t === 'event') {
      out.push({ kind: 'event', event: it.e })
      lastSender = -1
      continue
    }
    const grouped = it.m.senderId === lastSender && it.at - lastTime < 5 * 60 * 1000
    out.push({ kind: 'msg', message: it.m, showSender: !grouped, grouped })
    lastSender = it.m.senderId
    lastTime = it.at
  }
  return out
}

function fileNameFromUrl(url: string): string {
  try { const u = new URL(url); return decodeURIComponent(u.pathname.split('/').pop() || 'file') } catch { return 'file' }
}
