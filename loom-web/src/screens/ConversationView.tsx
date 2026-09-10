import { memo, useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Phone, Video, Search, MoreVertical, UserPlus, FileText, Film, Megaphone, CheckCheck, Check, Clock, AlertCircle, ArrowDown, CloudOff, CornerUpRight, Pin, Upload } from 'lucide-react'
import { useChat } from '../store/chat'
import { useNav } from '../store/nav'
import { useAuth } from '../store/auth'
import { chatsApi } from '../lib/api'
import { Avatar } from '../ui/Avatar'
import { ThreadSkeleton } from '../ui/Skeleton'
import { VoiceBubble } from '../ui/VoiceBubble'
import { CraftedObject } from '../ui/CraftedObject'
import { giftByName } from '../assets/loom'
import { useGiftsReady } from '../ui/useGifts'
import { Wallpaper } from '../ui/Wallpaper'
import { timeShort, dayLabel, fileSize, presenceText } from '../ui/format'
import { isOnline, type UserStatus } from '../lib/enums'
import type { Chat, ChatMember, Message, LoomEvent } from '../lib/types'
import { Composer, MessageContextMenu } from './conversation-parts'
import { useThreadScroll } from './useThreadScroll'
import { type LightboxItem } from '../ui/Lightbox'
import { PinnedBar } from './PinnedBar'
import { ForwardModal } from './ForwardModal'
import { EventCard } from '../components/EventCard'
import { thumbUrl } from '../ui/format'
import { toast } from '../ui/toast'

const Lightbox = lazy(() => import('../ui/Lightbox').then((m) => ({ default: m.Lightbox })))

export function ConversationView({ chatId }: { chatId: number }) {
  const navigate = useNavigate()
  const openSearch = useNav((s) => s.openSearch)
  const me = useAuth((s) => s.me)
  const messages = useChat((s) => s.messages[chatId])
  const events = useChat((s) => s.events[chatId])
  const loading = useChat((s) => s.msgLoading[chatId])
  const typing = useChat((s) => s.typing[chatId])
  const presence = useChat((s) => s.presence)
  const openChat = useChat((s) => s.openChat)
  const closeChat = useChat((s) => s.closeChat)
  const loadMore = useChat((s) => s.loadMore)
  const hasMore = useChat((s) => s.msgHasMore[chatId])
  const retrySend = useChat((s) => s.retrySend)
  const discardMessage = useChat((s) => s.discardMessage)
  const cancelUpload = useChat((s) => s.cancelUpload)
  const sendMedia = useChat((s) => s.sendMedia)

  const [fetchedChat, setFetchedChat] = useState<Chat | null>(null)
  const [members, setMembers] = useState<ChatMember[]>([])
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editing, setEditing] = useState<Message | null>(null)
  const [menuFor, setMenuFor] = useState<{ message: Message; x: number; y: number } | null>(null)
  const [forwardFor, setForwardFor] = useState<Message | null>(null)
  const pinnedCount = useChat((s) => s.pinned[chatId]?.length ?? 0)
  const [lightboxId, setLightboxId] = useState<number | null>(null)
  const [dropping, setDropping] = useState(false)
  const dragDepth = useRef(0)

  const uploadFiles = useCallback((files: File[]) => {
    for (const f of files) void sendMedia(chatId, f).catch(() => toast(`Could not send ${f.name}`))
  }, [chatId, sendMedia])

  // Paste a screenshot straight into the conversation.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? [])
      if (!files.length) return
      e.preventDefault()
      uploadFiles(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [uploadFiles])
  // Every photo in the loaded thread, so the viewer can page through them.
  const photos = useMemo<LightboxItem[]>(
    () => (messages ?? [])
      .filter((m) => m.type === 'Image' && !m.isDeleted)
      .map((m) => ({ id: m.id, url: m.content, caption: m.senderName })),
    [messages])

  // Phase 4: anchoring, per-chat position memory and the "new messages" pill.
  const { threadRef, onScroll, newCount, scrollToBottom } = useThreadScroll({
    chatId, messages, hasMore, loadMore, myId: me?.id,
  })

  useEffect(() => {
    void openChat(chatId)
    return () => closeChat(chatId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  // Prefer the store copy so the header follows live changes — a renamed group, a new
  // avatar, a role change — instead of freezing whatever was true when the chat opened.
  // Select just THIS chat: subscribing to the whole `chats` array re-rendered the open
  // conversation every time any other chat received a message (bumpPreview replaces it).
  const storeChat = useChat((s) => s.chats.find((c) => c.id === chatId)) ?? null
  const chat = storeChat ?? fetchedChat

  useEffect(() => {
    if (!storeChat) chatsApi.byId(chatId).then(setFetchedChat).catch(() => {})
    chatsApi.members(chatId).then(setMembers).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  const other = useMemo(() => members.find((m) => m.userId !== me?.id), [members, me])
  const isDirect = chat?.type === 'Direct'
  const title = chat?.title || other?.displayName || (chat?.type === 'Direct' ? 'Direct chat' : chat?.type ?? 'Chat')

  const status: { text: string; online: boolean } = useMemo(() => {
    if (isDirect && other) {
      const p = presence[other.userId]
      const online = p ? p.online : isOnline(other.status as UserStatus)
      // ChatMember carries no lastSeenAt; the live presence entry (p) supplies it when offline.
      return { text: presenceText(other.status as UserStatus, null, p), online }
    }
    const count = chat?.membersCount ?? members.length
    // A channel is a broadcast, not a room — "N subscribers", and no online tally.
    if (chat?.type === 'Channel') return { text: `${count} ${count === 1 ? 'subscriber' : 'subscribers'}`, online: false }
    const onlineCount = members.filter((m) => (presence[m.userId]?.online ?? isOnline(m.status as UserStatus))).length
    return { text: `${count} members${onlineCount ? `, ${onlineCount} online` : ''}`, online: false }
  }, [isDirect, other, presence, members, chat])

  // Messages that arrive AFTER the chat was opened animate in; existing history does not.
  const openedAt = useMemo(() => Date.now(), [chatId])
  // The server now fills ReplyToPreview + ReplyToSenderName, so the quote renders even for
  // originals outside the loaded pages. We still keep this map as a fallback (and to make
  // the quote tappable / richer for media, which the preview text can't express).
  const byId = useMemo(() => {
    const m = new Map<number, Message>()
    for (const x of messages ?? []) m.set(x.id, x)
    return m
  }, [messages])

  const jumpToMessage = useCallback((id: number) => {
    const el = threadRef.current?.querySelector<HTMLElement>(`[data-mid="${id}"]`)
    if (!el) { toast('Original message isn’t loaded yet'); return }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash')
    window.setTimeout(() => el.classList.remove('flash'), 1200)
  }, [threadRef])

  /**
   * A search hit may live far up the history. Page backwards (bounded) until the message
   * is in the store, then jump — instead of "isn't loaded yet" for anything older.
   */
  const location = useLocation()
  const jumpTarget = (location.state as { jumpTo?: number } | null)?.jumpTo ?? null
  const jumpedFor = useRef<number | null>(null)
  useEffect(() => {
    if (jumpTarget == null || jumpedFor.current === jumpTarget) return
    let cancelled = false
    const attempt = async (left: number): Promise<void> => {
      if (cancelled) return
      const here = useChat.getState().messages[chatId] ?? []
      if (here.some((m) => m.id === jumpTarget)) {
        jumpedFor.current = jumpTarget
        // let the row paint before scrolling to it; a timeout (not rAF) so this still
        // works when the tab is in the background and rAF is paused
        window.setTimeout(() => jumpToMessage(jumpTarget), 40)
        return
      }
      if (left <= 0 || !useChat.getState().msgHasMore[chatId]) {
        jumpedFor.current = jumpTarget
        toast('That message is further back than we could load')
        return
      }
      await useChat.getState().loadMore(chatId)
      return attempt(left - 1)
    }
    void attempt(8)
    return () => { cancelled = true }
  }, [jumpTarget, chatId, jumpToMessage])

  // Stable handlers: inline closures would change identity every render and defeat
  // the memo on Bubble, re-rendering the whole thread on each incoming message.
  const handleReply = useCallback((m: Message) => { setEditing(null); setReplyTo(m) }, [])
  const handleMenu = useCallback((m: Message, pt: { x: number; y: number }) => setMenuFor({ message: m, ...pt }), [])
  const handleProfile = useCallback((id: number) => navigate(`/u/${id}`), [navigate])
  const handleRetry = useCallback((id: number) => { void retrySend(chatId, id) }, [chatId, retrySend])
  const handleDiscard = useCallback((id: number) => discardMessage(chatId, id), [chatId, discardMessage])
  const handleCancelUpload = useCallback((id: number) => cancelUpload(chatId, id), [chatId, cancelUpload])
  const grouped = useMemo(() => buildTimeline(messages ?? [], events ?? []), [messages, events])
  // Resolve sender name/avatar from the members list when a message DTO lacks them
  // (e.g. live-broadcast messages whose senderName can come back empty).
  const memberById = useMemo(() => {
    const m = new Map<number, ChatMember>()
    for (const mm of members) m.set(mm.userId, mm)
    return m
  }, [members])

  return (
    <div
      className={`pane conv ${pinnedCount > 0 ? 'has-pin' : ''}`}
      style={{ flex: 1, minWidth: 0, position: 'relative' }}
      onDragEnter={(e) => { if (e.dataTransfer?.types?.includes('Files')) { dragDepth.current++; setDropping(true) } }}
      onDragOver={(e) => { if (e.dataTransfer?.types?.includes('Files')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' } }}
      onDragLeave={() => { dragDepth.current = Math.max(0, dragDepth.current - 1); if (dragDepth.current === 0) setDropping(false) }}
      onDrop={(e) => {
        if (!e.dataTransfer?.files?.length) return
        e.preventDefault()
        dragDepth.current = 0
        setDropping(false)
        uploadFiles(Array.from(e.dataTransfer.files))
      }}
    >
      {dropping && (
        <div className="drop-overlay" aria-hidden>
          <div className="drop-card">
            <Upload size={30} />
            <div className="drop-title">Drop to send</div>
            <div className="drop-sub">Photos and files — several at once is fine</div>
          </div>
        </div>
      )}
      {/* header */}
      <div className="chat-header frost">
        <button className="icon-btn mobile-only" onClick={() => navigate('/')} aria-label="Back to chats"><ChevronLeft size={24} /></button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: 0, flex: 1, minWidth: 0, textAlign: 'left' }}
          onClick={() => { if (isDirect && other) navigate(`/u/${other.userId}`); else navigate(`/chat/${chatId}/members`) }}>
          <Avatar name={title} id={isDirect ? (other?.userId ?? chatId) : chatId} src={isDirect ? (other?.avatarUrl ?? chat?.avatarUrl) : chat?.avatarUrl} size={34} online={status.online} />
          <div style={{ minWidth: 0 }}>
            <div className="h-name ellipsis">{title}</div>
            <div className={`h-status ellipsis ${status.online ? 'online' : ''}`}>
              {typing && typing.length > 0 ? 'typing…' : status.text}
            </div>
          </div>
        </button>
        <div className="h-actions">
          <button className="icon-btn desktop-only" onClick={() => toast('Voice call — coming soon')} aria-label="Voice call — coming soon" title="Voice call — coming soon" data-soon><Phone size={19} /></button>
          <button className="icon-btn" onClick={() => toast('Video call — coming soon')} aria-label="Video call — coming soon" title="Video call — coming soon" data-soon><Video size={19} /></button>
          <button className="icon-btn" onClick={() => openSearch({ chatId, chatTitle: title })}
            aria-label="Search in this chat" title="Search in this chat"><Search size={19} /></button>
          {!isDirect && (chat?.myRole === 'Owner' || chat?.myRole === 'Admin') && (
            <button className="icon-btn" onClick={() => navigate(`/chat/${chatId}/invite`)}
              aria-label="Invite people" title="Invite people"><UserPlus size={19} /></button>
          )}
          <button className="icon-btn" onClick={() => navigate(`/chat/${chatId}/members`)} aria-label="Chat info"><MoreVertical size={19} /></button>
        </div>
      </div>

      <PinnedBar chatId={chatId} onJump={jumpToMessage} />

      {/* thread + wallpaper */}
      <div className="thread-wrap">
        <Wallpaper />
        <div className="thread" ref={threadRef} onScroll={onScroll}>
          <div className="thread-inner">
            {loading && !messages ? <ThreadSkeleton />
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
                          isNew={new Date(g.message.sentAt).getTime() > openedAt}
                          quoted={g.message.replyToMessageId != null ? byId.get(g.message.replyToMessageId) : undefined}
                          onJump={jumpToMessage}
                          onOpenPhoto={setLightboxId}
                          onCancelUpload={handleCancelUpload}
                          onReply={handleReply}
                          onMenu={handleMenu}
                          onOpenProfile={handleProfile}
                          onRetry={handleRetry}
                          onDiscard={handleDiscard}
                        />
                ))}
          </div>
        </div>
      </div>

      {newCount > 0 && (
        <button className="new-msgs anim-fade" onClick={() => scrollToBottom()}>
          <ArrowDown size={15} />
          {newCount} new {newCount === 1 ? 'message' : 'messages'}
        </button>
      )}

      {chat && chat.canPost === false ? (
        <div className="readonly-bar" role="status">
          <Megaphone size={15} />
          <span>Only admins can post in this channel</span>
        </div>
      ) : (
        <Composer
          chatId={chatId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
        />
      )}

      {lightboxId != null && photos.length > 0 && (
        <Suspense fallback={null}>
          <Lightbox items={photos} startId={lightboxId} onClose={() => setLightboxId(null)} />
        </Suspense>
      )}

      {forwardFor && <ForwardModal message={forwardFor} onClose={() => setForwardFor(null)} />}

      {menuFor && (
        <MessageContextMenu
          message={menuFor.message}
          mine={menuFor.message.senderId === me?.id}
          at={{ x: menuFor.x, y: menuFor.y }}
          onClose={() => setMenuFor(null)}
          onReply={() => { setEditing(null); setReplyTo(menuFor.message) }}
          onEdit={() => { setReplyTo(null); setEditing(menuFor.message) }}
          onForward={() => setForwardFor(menuFor.message)}
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
function GiftBubbleCard({ giftName, mine, senderName, isNew }: { giftName: string; mine: boolean; senderName: string; isNew: boolean }) {
  useGiftsReady()                    // the gift library is code-split; repaint on arrival
  const meta = giftByName(giftName)
  const backdrop = meta ? `radial-gradient(120% 100% at 50% 18%, ${meta.g1}, ${meta.g2})` : 'var(--surface-2)'
  const legendary = meta?.r === 'LEGENDARY'
  return (
    <div style={{ width: 224 }} className={isNew ? 'gift-card-in' : ''}>
      <div className="gift-art" style={{ position: 'relative', height: 124, borderRadius: 12, overflow: 'hidden', display: 'grid', placeItems: 'center', background: backdrop, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18), inset 0 -14px 26px rgba(0,0,0,.22)' }}>
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

/** Author of the quoted message: server value first, then the locally-loaded original. */
function replyAuthor(m: Message, quoted?: Message): string {
  return m.replyToSenderName || quoted?.senderName || 'Message'
}

/**
 * One-line snippet for a quoted message. Prefer the locally-loaded original when we have
 * it (so media shows "📷 Photo" rather than a raw URL), else the server's preview text.
 */
function quotedSnippet(q: Message | undefined, fallback?: string | null): string {
  if (!q) return fallback || 'Original message'
  if (q.isDeleted) return 'Deleted message'
  const label: Record<string, string> = {
    Image: '📷 Photo', Video: '🎬 Video', File: '📎 File',
    Voice: '🎙 Voice message', Sticker: 'Sticker', Gift: '🎁 Gift',
  }
  return q.type === 'Text' ? q.content : (label[q.type] ?? q.content)
}

/* Photo bubble: holds a reserved box until the image decodes, then fades it in —
   so a loading photo never reflows the thread under the reader. */
function ChatImage({ src, onOpen }: { src: string; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={`card-photo ${loaded ? 'is-loaded' : ''}`} role="button" tabIndex={0} title="Open photo"
      onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter') onOpen() }}>
      {/* the bubble is at most ~320px wide, so never pull the full-size original */}
      <img src={thumbUrl(src, 360)} alt="" decoding="async" onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} />
    </div>
  )
}

/* ---------------- Bubble ---------------- */
const Bubble = memo(function Bubble({ message, mine, showSender, grouped, senderName, senderAvatarUrl, isNew, quoted, onJump, onOpenPhoto, onCancelUpload, onReply, onMenu, onOpenProfile, onRetry, onDiscard }: {
  message: Message
  mine: boolean
  showSender: boolean
  grouped: boolean
  senderName: string          // resolved (message.senderName, falling back to member list)
  senderAvatarUrl?: string | null
  isNew: boolean                              // arrived after the chat was opened → slides in
  quoted?: Message                            // the message this one replies to, if loaded
  onJump: (id: number) => void                // scroll to the quoted original
  onOpenPhoto: (id: number) => void           // open this photo in the lightbox
  onCancelUpload: (id: number) => void        // abort an in-flight media upload
  onReply: (m: Message) => void
  onMenu: (m: Message, pt: { x: number; y: number }) => void
  onOpenProfile: (senderId: number) => void   // tap sender avatar/name → open their profile
  onRetry: (id: number) => void               // failed optimistic send → try again
  onDiscard: (id: number) => void             // failed optimistic send → drop it
}) {
  const react = useChat((s) => s.react)
  const pressTimer = useRef<number>()
  const [pressing, setPressing] = useState(false)

  // Long-press is a touch gesture only — desktop opens the menu with right-click.
  const startPress = (e: React.TouchEvent) => {
    const t = e.touches[0]
    const pt = { x: t.clientX, y: t.clientY }
    setPressing(true)
    pressTimer.current = window.setTimeout(() => { setPressing(false); onMenu(message, pt) }, 480)
  }
  const endPress = () => { window.clearTimeout(pressTimer.current); setPressing(false) }


  // Stickers render large, no bubble
  if (message.type === 'Sticker' && !message.isDeleted) {
    return (
      <div data-mid={message.id} className={`msg-row ${mine ? 'out' : ''} ${grouped ? 'grouped' : ''} ${isNew ? 'msg-in' : ''}`} onContextMenu={(e) => { e.preventDefault(); onMenu(message, { x: e.clientX, y: e.clientY }) }}>
        {!mine && showSender ? <SenderAvatar name={senderName} id={message.senderId} src={senderAvatarUrl} onClick={() => onOpenProfile(message.senderId)} /> : (!mine ? <span style={{ width: 30, flex: '0 0 30px' }} /> : null)}
        <div style={{ position: 'relative' }} onDoubleClick={() => onReply(message)}
          onTouchStart={startPress} onTouchEnd={endPress} onTouchMove={endPress} onTouchCancel={endPress}>
          {!mine && showSender && <div className="sender" style={{ color: 'var(--accent-text)', cursor: 'pointer', marginBottom: 3 }} onClick={() => onOpenProfile(message.senderId)}>{senderName}</div>}
          <CraftedObject id={message.content} kind="sticker" size={128} />
          {message.reactions.length > 0 && <ReactionRow message={message} mine={mine} onToggle={(e) => react(message.id, message.chatId, e)} />}
        </div>
      </div>
    )
  }

  const isVoice = message.type === 'Voice' && !message.isDeleted
  const isImage = message.type === 'Image'
  const isFile = message.type === 'File' || message.type === 'Video'
  const isGift = message.type === 'Gift' && !message.isDeleted


  return (
    <div data-mid={message.id} className={`msg-row ${mine ? 'out' : ''} ${grouped ? 'grouped' : ''} ${isNew ? 'msg-in' : ''}`}
      onContextMenu={(e) => { e.preventDefault(); onMenu(message, { x: e.clientX, y: e.clientY }) }}>
      {!mine && showSender ? <SenderAvatar name={senderName} id={message.senderId} src={senderAvatarUrl} onClick={() => onOpenProfile(message.senderId)} /> : (!mine ? <span style={{ width: 30, flex: '0 0 30px' }} /> : null)}
      <div className={`bubble ${message.pending ? 'pending' : ''} ${message.failed ? 'failed' : ''} ${message.queued ? 'queued' : ''} ${pressing ? 'is-pressing' : ''}`} onTouchStart={startPress} onTouchEnd={endPress} onTouchMove={endPress} onTouchCancel={endPress} onDoubleClick={() => onReply(message)}>
        {!mine && showSender && <div className="sender" style={{ color: 'var(--accent-text)', cursor: 'pointer' }} onClick={() => onOpenProfile(message.senderId)}>{senderName}</div>}
        {message.forwardedFromSenderName && (
          <div className="fwd-from"><CornerUpRight size={13} /> Forwarded from {message.forwardedFromSenderName}</div>
        )}
        {message.replyToMessageId != null && (
          <button
            className="reply-quote"
            title="Go to the original message"
            onClick={(e) => { e.stopPropagation(); onJump(message.replyToMessageId!) }}
          >
            <span className="who ellipsis">{replyAuthor(message, quoted)}</span>
            <span className="qt ellipsis">{quotedSnippet(quoted, message.replyToPreview)}</span>
          </button>
        )}
        {message.isDeleted
          ? <div className="text" style={{ fontStyle: 'italic', opacity: .5 }}>Message deleted</div>
          : isGift
            ? <GiftBubbleCard giftName={message.content} mine={mine} senderName={senderName} isNew={isNew} />
            : isImage
            ? <ChatImage src={message.content} onOpen={() => onOpenPhoto(message.id)} />
            : isVoice
              ? <VoiceBubble src={message.content} seconds={message.voiceSeconds} mine={mine} />
            : isFile
              ? <a className="card-file" href={message.content} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                  <span className="file-ic">{message.type === 'Video' ? <Film size={20} /> : <FileText size={20} />}</span>
                  <span><div className="fn ellipsis" style={{ maxWidth: 180 }}>{fileNameFromUrl(message.content)}</div><div className="fs">{message.type === 'Video' ? 'Video' : 'File'}</div></span>
                </a>
              : <div className="text">{message.content}</div>}

        <div className="foot">
          {message.isPinned && !message.isDeleted && <Pin size={11} className="pin-mark" aria-label="Pinned" />}
          {message.isEdited && !message.isDeleted && <span className="edited">edited</span>}
          <span className="time">{timeShort(message.sentAt)}</span>
          {mine && !message.isDeleted && !message.failed && !message.queued && (
            <span className="ticks">
              {message.pending ? <Clock size={14} style={{ opacity: .65 }} />
                : message.status === 'Read' ? <CheckCheck size={15} />
                  : message.status === 'Delivered' ? <CheckCheck size={15} style={{ opacity: .6 }} />
                    : <Check size={15} style={{ opacity: .6 }} />}
            </span>
          )}
        </div>

        {message.uploadPct != null && message.pending && (
          <div className="up-progress">
            <div className="up-bar"><span style={{ width: `${message.uploadPct}%` }} /></div>
            <span className="up-pct">{message.uploadPct}%</span>
            <button onClick={() => onCancelUpload(message.id)} aria-label="Cancel upload">Cancel</button>
          </div>
        )}

        {message.queued && (
          <div className="msg-queued">
            <CloudOff size={13} />
            <span>Waiting for connection</span>
            <button onClick={() => onRetry(message.id)}>Retry now</button>
            <button onClick={() => onDiscard(message.id)} aria-label="Discard message">Discard</button>
          </div>
        )}

        {message.failed && (
          <div className="msg-failed">
            <AlertCircle size={13} />
            <span>Not sent</span>
            <button onClick={() => onRetry(message.id)}>Retry</button>
            <button onClick={() => onDiscard(message.id)} aria-label="Discard message">Discard</button>
          </div>
        )}

        {message.reactions.length > 0 && <ReactionRow message={message} mine={mine} onToggle={(e) => react(message.id, message.chatId, e)} />}
      </div>
    </div>
  )
})

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
