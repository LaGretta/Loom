import { create } from 'zustand'
import { chatsApi, messagesApi, eventsApi, mediaApi } from '../lib/api'
import { signalr } from '../lib/signalr'
import { tokenStore } from '../lib/tokenStore'
import { toast } from '../ui/toast'
import { ApiError } from '../lib/http'
import { addToOutbox, readOutbox, removeFromOutbox, type OutboxItem } from '../lib/outbox'
import type { Chat, Message, LoomEvent } from '../lib/types'
import { MessageTypeE } from '../lib/enums'

function myId(): number | null { return tokenStore.user?.id ?? null }

interface TypingEntry { userId: number; timer: number }

interface ChatState {
  chats: Chat[]
  chatsLoading: boolean
  chatsError: string | null
  activeChatId: number | null

  messages: Record<number, Message[]>        // ascending (oldest first)
  msgLoading: Record<number, boolean>
  msgHasMore: Record<number, boolean>
  msgPage: Record<number, number>
  msgLoaded: Record<number, boolean>         // true once server history was fetched (vs. only stray live msgs)

  presence: Record<number, { online: boolean; lastSeenAt?: string }>
  typing: Record<number, TypingEntry[]>      // chatId -> typing users
  events: Record<number, LoomEvent[]>        // chatId -> shared event cards

  hubConnected: boolean

  loadChats: () => Promise<void>
  openChat: (chatId: number) => Promise<void>
  closeChat: (chatId: number) => void
  loadMore: (chatId: number) => Promise<void>
  send: (chatId: number, content: string, replyToMessageId?: number | null) => Promise<void>
  sendMedia: (chatId: number, file: File) => Promise<void>
  sendVoice: (chatId: number, blob: Blob, seconds: number) => Promise<void>
  cancelUpload: (chatId: number, tempId: number) => void
  retrySend: (chatId: number, tempId: number) => Promise<void>
  discardMessage: (chatId: number, tempId: number) => void
  edit: (messageId: number, chatId: number, content: string) => Promise<void>
  remove: (messageId: number, chatId: number) => Promise<void>
  react: (messageId: number, chatId: number, emoji: string) => Promise<void>
  markRead: (messageId: number) => void
  toggleMute: (chatId: number) => Promise<void>
  refreshChat: (chatId: number) => Promise<void>
  updateChat: (chatId: number, patch: { title?: string; description?: string; avatarUrl?: string }) => Promise<void>
  leaveChat: (chatId: number) => Promise<void>
  deleteChat: (chatId: number) => Promise<void>
  bumpMembers: (chatId: number, delta: number) => void
  dropChatLocal: (chatId: number) => void
  pinned: Record<number, Message[]>
  loadPinned: (chatId: number) => Promise<void>
  togglePin: (messageId: number, chatId: number) => Promise<void>
  forwardMessage: (messageId: number, targetChatId: number) => Promise<Message | null>
  sendTyping: (chatId: number) => void
  ingestMessage: (m: Message) => void
  applyEdited: (m: Message) => void
  applyDeleted: (messageId: number) => void
  applyReactionUpdate: (m: Message) => void
  applyReadReceipt: (messageId: number, userId: number) => void
  revalidateChat: (chatId: number) => Promise<void>
  resyncAll: () => Promise<void>
  hydrateOutbox: () => void
  flushOutbox: () => Promise<void>
  loadEvents: (chatId: number) => Promise<void>
  upsertEvent: (ev: LoomEvent) => void
  reset: () => void
}

function findChatIdByMessage(messages: Record<number, Message[]>, messageId: number): number | null {
  for (const key of Object.keys(messages)) {
    const cid = Number(key)
    if ((messages[cid] ?? []).some((m) => m.id === messageId)) return cid
  }
  return null
}

const PAGE = 30

/* --- incoming-message fan-out (notifications subscribe here; the store stays UI-free) --- */
export interface IncomingInfo { message: Message; isActiveChat: boolean; isMuted: boolean }
type IncomingHandler = (info: IncomingInfo) => void
const incomingHandlers = new Set<IncomingHandler>()
export function onIncomingMessage(fn: IncomingHandler) {
  incomingHandlers.add(fn)
  return () => { incomingHandlers.delete(fn) }
}

let seq = 0
const nextTempId = () => -(Date.now() * 1000 + (++seq % 1000))

/** Chat-list preview/order bump for a message we just rendered optimistically. */
function bumpPreview(chats: Chat[], m: Message): Chat[] {
  let found = false
  const next = chats.map((c) => {
    if (c.id !== m.chatId) return c
    found = true
    return { ...c, lastMessage: { senderName: m.senderName, content: m.content, type: m.type, sentAt: m.sentAt } }
  })
  return found ? [...next].sort((a, b) => (a.id === m.chatId ? -1 : b.id === m.chatId ? 1 : 0)) : next
}

/**
 * Reaction toggles I started, still waiting for their broadcast. Two things depend on it:
 *  - a background revalidate must not overwrite a reaction mid-toggle (it would show the
 *    pre-toggle state until the event lands);
 *  - `reactedByMe` on the broadcast is computed for whoever toggled, so it is correct for
 *    ME only when I am that person — otherwise it describes someone else and must be
 *    re-derived from what we already hold.
 */
const myPendingToggles = new Map<number, number>()   // messageId -> started at
const TOGGLE_TTL = 10_000
const isMyToggle = (id: number) => {
  const t = myPendingToggles.get(id)
  if (t == null) return false
  if (Date.now() - t > TOGGLE_TTL) { myPendingToggles.delete(id); return false }
  return true
}

/** Keep counts/emoji from the server; take `reactedByMe` from local truth. */
function withMyReactionFlags(incoming: Message, existing?: Message): Message {
  const mine = new Map((existing?.reactions ?? []).map((r) => [r.emoji, r.reactedByMe]))
  return {
    ...incoming,
    reactions: (incoming.reactions ?? []).map((r) => ({ ...r, reactedByMe: mine.get(r.emoji) ?? false })),
  }
}

// Guards against two flushes running at once (StrictMode double-mount, an `online`
// event landing mid-flush, a reconnect resync overlapping): both would read the same
// queue and POST every item twice.
let flushing = false

/** Abort handles for in-flight media uploads, keyed by the optimistic message id. */
const uploads = new Map<number, AbortController>()

/**
 * A 4xx is the server saying "no" — retrying changes nothing, so those fail outright.
 * Network errors, timeouts and 5xx are transport problems: those go to the outbox.
 */
function isRetryable(e: unknown): boolean {
  if (e instanceof ApiError) return e.status >= 500 || e.status === 408 || e.status === 429
  return true
}

/** Build the optimistic bubble shown the instant the user hits send. */
function draftMessage(chatId: number, content: string, type: Message['type'], replyTo: Message | null): Message {
  return {
    id: nextTempId(),
    clientId: `c${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    pending: true,
    chatId,
    senderId: myId() ?? 0,
    senderName: '',
    senderAvatarUrl: null,
    content,
    type,
    status: 'Sent',
    replyToMessageId: replyTo?.id ?? null,
    replyToPreview: replyTo?.content ?? null,
    replyToSenderName: replyTo?.senderName ?? null,
    isEdited: false,
    isDeleted: false,
    sentAt: new Date().toISOString(),
    attachments: [],
    reactions: [],
  }
}

export const useChat = create<ChatState>((set, get) => ({
  chats: [],
  chatsLoading: false,
  chatsError: null,
  activeChatId: null,
  messages: {},
  msgLoading: {},
  msgHasMore: {},
  msgPage: {},
  msgLoaded: {},
  presence: {},
  typing: {},
  events: {},
  pinned: {},
  hubConnected: false,

  loadChats: async () => {
    set({ chatsLoading: true, chatsError: null })
    try {
      const chats = await chatsApi.list()
      set({ chats, chatsLoading: false })
      // Join EVERY chat's realtime group so live events (new messages, unread bumps, and
      // shared event cards via "EventShared") arrive even for chats that aren't open.
      for (const c of chats) void signalr.joinChat(c.id)
    } catch (e: any) {
      set({ chatsLoading: false, chatsError: e?.message ?? 'Failed to load chats' })
    }
  },

  openChat: async (chatId) => {
    set({ activeChatId: chatId })
    void signalr.joinChat(chatId)
    // clear unread — locally + server-side
    set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)) }))
    void chatsApi.read(chatId).catch(() => {})
    // load shared event cards for this chat (survives reload)
    void get().loadEvents(chatId)
    void get().loadPinned(chatId)
    // Only skip the history fetch once we've actually loaded it from the server.
    // A thread may already hold a few *live* messages that arrived via SignalR before
    // it was opened — those must NOT count as "loaded", or we'd show them alone.
    if (get().msgLoaded[chatId]) {
      // Already cached → render instantly, then refresh in the background.
      void get().revalidateChat(chatId)
      return
    }
    set((s) => ({ msgLoading: { ...s.msgLoading, [chatId]: true } }))
    try {
      const res = await messagesApi.list(chatId, 1, PAGE)
      const asc = [...res.items].reverse()
      set((s) => {
        // Merge server history with any stray live messages, dedupe by id, order by time.
        const stray = s.messages[chatId] ?? []
        const ids = new Set(asc.map((m) => m.id))
        const prev = new Map(stray.map((m) => [m.id, m]))
        const merged = [
          ...asc.map((m) => (isMyToggle(m.id) && prev.has(m.id) ? { ...m, reactions: prev.get(m.id)!.reactions } : m)),
          ...stray.filter((m) => !ids.has(m.id)),
        ]
          .sort((a, b) => a.sentAt.localeCompare(b.sentAt) || a.id - b.id)
        return {
          messages: { ...s.messages, [chatId]: merged },
          msgLoading: { ...s.msgLoading, [chatId]: false },
          msgHasMore: { ...s.msgHasMore, [chatId]: res.items.length >= PAGE && asc.length < res.totalCount },
          msgPage: { ...s.msgPage, [chatId]: 1 },
          msgLoaded: { ...s.msgLoaded, [chatId]: true },
        }
      })
      // mark newest incoming as read
      const last = get().messages[chatId]?.[get().messages[chatId].length - 1]
      if (last && last.senderId !== myId()) get().markRead(last.id)
    } catch {
      set((s) => ({ msgLoading: { ...s.msgLoading, [chatId]: false } }))
    }
  },

  closeChat: (chatId) => {
    // Stay in the chat's realtime group so we keep receiving its live updates
    // (shared events, messages) while viewing other screens.
    if (get().activeChatId === chatId) set({ activeChatId: null })
  },

  loadMore: async (chatId) => {
    if (get().msgLoading[chatId] || !get().msgHasMore[chatId]) return
    const nextPage = (get().msgPage[chatId] ?? 1) + 1
    set((s) => ({ msgLoading: { ...s.msgLoading, [chatId]: true } }))
    try {
      const res = await messagesApi.list(chatId, nextPage, PAGE)
      const older = [...res.items].reverse()
      set((s) => {
        const existing = s.messages[chatId] ?? []
        const ids = new Set(existing.map((m) => m.id))
        const merged = [...older.filter((m) => !ids.has(m.id)), ...existing]
        const total = res.totalCount
        return {
          messages: { ...s.messages, [chatId]: merged },
          msgLoading: { ...s.msgLoading, [chatId]: false },
          msgPage: { ...s.msgPage, [chatId]: nextPage },
          msgHasMore: { ...s.msgHasMore, [chatId]: merged.length < total },
        }
      })
    } catch {
      set((s) => ({ msgLoading: { ...s.msgLoading, [chatId]: false } }))
    }
  },

  // Optimistic text send: the bubble lands in the thread on the same frame as the keypress,
  // then reconciles with the server message (deduping the SignalR echo). Never throws —
  // a failure is surfaced on the bubble itself (failed + Retry), not as a lost message.
  send: async (chatId, content, replyToMessageId) => {
    const replyTo = replyToMessageId
      ? (get().messages[chatId] ?? []).find((m) => m.id === replyToMessageId) ?? null
      : null
    const draft = draftMessage(chatId, content, 'Text', replyTo)
    set((s) => ({
      messages: { ...s.messages, [chatId]: [...(s.messages[chatId] ?? []), draft] },
      chats: bumpPreview(s.chats, draft),
    }))
    await deliver(chatId, draft)
  },

  /** Abort an in-flight media upload; the optimistic bubble disappears with it. */
  cancelUpload: (chatId, tempId) => {
    const ctrl = uploads.get(tempId)
    if (!ctrl) return
    ctrl.abort()
    uploads.delete(tempId)
    void chatId
  },

  retrySend: async (chatId, tempId) => {
    const msg = (get().messages[chatId] ?? []).find((m) => m.id === tempId)
    if (!msg || (!msg.failed && !msg.queued)) return
    removeFromOutbox(tempId)
    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map((m) => (m.id === tempId ? { ...m, pending: true, failed: false } : m)),
      },
    }))
    await deliver(chatId, { ...msg, pending: true, failed: false, queued: false })
  },

  discardMessage: (chatId, tempId) => {
    removeFromOutbox(tempId)
    set((s) => ({
      messages: { ...s.messages, [chatId]: (s.messages[chatId] ?? []).filter((m) => m.id !== tempId) },
    }))
  },

  // Photo/file send with an optimistic bubble: render the local file instantly (blob URL)
  // while upload → send runs, then swap the temp message for the real one. So the sender
  // sees the image immediately instead of staring at nothing through two round-trips.
  sendMedia: async (chatId, file) => {
    const tempId = -Date.now()
    const objectUrl = URL.createObjectURL(file)
    const isImg = file.type.startsWith('image/')
    const optimistic: Message = {
      id: tempId, chatId, senderId: myId() ?? 0, senderName: '', senderAvatarUrl: null,
      content: objectUrl, type: isImg ? 'Image' : 'File', status: 'Sent', pending: true, uploadPct: 0,
      replyToMessageId: null, replyToPreview: null, isEdited: false, isDeleted: false,
      sentAt: new Date().toISOString(), attachments: [], reactions: [],
    }
    set((s) => ({ messages: { ...s.messages, [chatId]: [...(s.messages[chatId] ?? []), optimistic] } }))
    const ctrl = new AbortController()
    uploads.set(tempId, ctrl)
    const onProgress = (pct: number) => set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map((m) => (m.id === tempId ? { ...m, uploadPct: pct } : m)),
      },
    }))
    try {
      const { url } = await mediaApi.uploadProgress(file, { onProgress, signal: ctrl.signal })
      const msg = await messagesApi.send({ chatId, content: url, type: isImg ? 'Image' : 'File' })
      // Drop the temp bubble (and any duplicate the SignalR echo may have added), then ingest
      // the real message so preview/unread/order update the same way as a normal send.
      set((s) => ({
        messages: {
          ...s.messages,
          [chatId]: (s.messages[chatId] ?? []).filter((m) => m.id !== tempId && m.id !== msg.id),
        },
      }))
      get().ingestMessage(msg)
    } catch (e) {
      // A cancel simply removes the bubble; a real failure is reported by the caller.
      set((s) => ({
        messages: { ...s.messages, [chatId]: (s.messages[chatId] ?? []).filter((m) => m.id !== tempId) },
      }))
      if ((e as DOMException)?.name !== 'AbortError') throw e
    } finally {
      uploads.delete(tempId)
      URL.revokeObjectURL(objectUrl)
    }
  },

  // Optimistic edit: new text + "edited" render immediately; the original is restored on failure.
  // Voice note: same optimistic shape as a photo — a local blob URL plays immediately
  // while upload → send runs, then the temp bubble is swapped for the real message.
  sendVoice: async (chatId, blob, seconds) => {
    const tempId = nextTempId()
    const objectUrl = URL.createObjectURL(blob)
    const optimistic: Message = {
      id: tempId, chatId, senderId: myId() ?? 0, senderName: '', senderAvatarUrl: null,
      content: objectUrl, type: 'Voice', status: 'Sent', pending: true,
      replyToMessageId: null, replyToPreview: null, isEdited: false, isDeleted: false,
      sentAt: new Date().toISOString(), attachments: [], reactions: [],
      voiceSeconds: seconds,
    }
    set((s) => ({
      messages: { ...s.messages, [chatId]: [...(s.messages[chatId] ?? []), optimistic] },
      chats: bumpPreview(s.chats, optimistic),
    }))
    const ctrl = new AbortController()
    uploads.set(tempId, ctrl)
    try {
      const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm'
      const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type || 'audio/webm' })
      const { url } = await mediaApi.uploadProgress(file, {
        signal: ctrl.signal,
        onProgress: (pct) => set((s) => ({
          messages: {
            ...s.messages,
            [chatId]: (s.messages[chatId] ?? []).map((m) => (m.id === tempId ? { ...m, uploadPct: pct } : m)),
          },
        })),
      })
      const msg = await messagesApi.send({ chatId, content: url, type: 'Voice' })
      set((s) => ({
        messages: {
          ...s.messages,
          [chatId]: (s.messages[chatId] ?? []).filter((m) => m.id !== tempId && m.id !== msg.id),
        },
      }))
      get().ingestMessage({ ...msg, voiceSeconds: seconds })
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') {
        set((s) => ({ messages: { ...s.messages, [chatId]: (s.messages[chatId] ?? []).filter((m) => m.id !== tempId) } }))
      } else {
        set((s) => ({
          messages: {
            ...s.messages,
            [chatId]: (s.messages[chatId] ?? []).map((m) =>
              m.id === tempId ? { ...m, pending: false, failed: true, uploadPct: undefined } : m),
          },
        }))
        toast('Could not send the voice message')
      }
    } finally {
      uploads.delete(tempId)
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
    }
  },

  edit: async (messageId, chatId, content) => {
    const before = (get().messages[chatId] ?? []).find((m) => m.id === messageId)
    if (!before) return
    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map((m) => (m.id === messageId ? { ...m, content, isEdited: true } : m)),
      },
    }))
    try {
      const updated = await messagesApi.edit({ messageId, content })
      set((s) => ({
        messages: { ...s.messages, [chatId]: (s.messages[chatId] ?? []).map((m) => (m.id === messageId ? updated : m)) },
      }))
    } catch {
      set((s) => ({
        messages: { ...s.messages, [chatId]: (s.messages[chatId] ?? []).map((m) => (m.id === messageId ? before : m)) },
      }))
      toast('Could not edit message')
    }
  },

  // Optimistic delete: the bubble collapses to "Message deleted" at once, restored on failure.
  remove: async (messageId, chatId) => {
    const before = (get().messages[chatId] ?? []).find((m) => m.id === messageId)
    if (!before) return
    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: '' } : m),
      },
    }))
    try {
      await messagesApi.remove(messageId)
    } catch {
      set((s) => ({
        messages: { ...s.messages, [chatId]: (s.messages[chatId] ?? []).map((m) => (m.id === messageId ? before : m)) },
      }))
      toast('Could not delete message')
    }
  },

  react: async (messageId, chatId, emoji) => {
    const before = (get().messages[chatId] ?? []).find((m) => m.id === messageId)?.reactions ?? []
    // optimistic toggle
    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map((m) => {
          if (m.id !== messageId) return m
          const existing = m.reactions.find((r) => r.emoji === emoji)
          let reactions
          if (existing) {
            const mine = existing.reactedByMe
            const count = existing.count + (mine ? -1 : 1)
            reactions = count <= 0
              ? m.reactions.filter((r) => r.emoji !== emoji)
              : m.reactions.map((r) => (r.emoji === emoji ? { ...r, count, reactedByMe: !mine } : r))
          } else {
            reactions = [...m.reactions, { emoji, count: 1, reactedByMe: true }]
          }
          return { ...m, reactions }
        }),
      },
    }))
    myPendingToggles.set(messageId, Date.now())
    try {
      await messagesApi.react({ messageId, emoji })
    } catch {
      myPendingToggles.delete(messageId)
      // straight rollback to the pre-toggle reactions — no refetch, no flicker
      set((s) => ({
        messages: {
          ...s.messages,
          [chatId]: (s.messages[chatId] ?? []).map((m) => (m.id === messageId ? { ...m, reactions: before } : m)),
        },
      }))
      toast('Could not react')
    }
  },

  markRead: (messageId) => { void messagesApi.markRead(messageId).catch(() => {}) },

  // Optimistic mute: the row flips at once; a muted chat also drops its unread badge
  // (the server reports unreadCount 0 for muted chats, so we mirror that locally).
  toggleMute: async (chatId) => {
    const before = get().chats.find((c) => c.id === chatId)
    if (!before) return
    const next = !before.isMuted
    set((s) => ({
      chats: s.chats.map((c) => (c.id === chatId
        ? { ...c, isMuted: next, unreadCount: next ? 0 : c.unreadCount }
        : c)),
    }))
    try {
      const res = await chatsApi.mute(chatId)
      set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, isMuted: res.isMuted } : c)) }))
    } catch {
      set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? before : c)) }))
      toast('Could not change mute')
    }
  },

  /** Re-read one chat (myRole, title, avatar, member count) — roles can change under us. */
  refreshChat: async (chatId) => {
    try {
      const fresh = await chatsApi.byId(chatId)
      // Patch only. Never insert: a chat we just left or deleted must not come back
      // because an in-flight refresh landed after the local drop.
      set((s) => (s.chats.some((c) => c.id === chatId)
        ? { chats: s.chats.map((c) => (c.id === chatId ? fresh : c)) }
        : {}))
    } catch { /* keep what we have; the caller surfaces its own error */ }
  },

  // PUT returns 204, so patch locally and re-read to confirm.
  updateChat: async (chatId, patch) => {
    await chatsApi.update(chatId, patch)
    set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, ...patch } : c)) }))
    void get().refreshChat(chatId)
  },

  leaveChat: async (chatId) => {
    await chatsApi.leave(chatId)
    get().dropChatLocal(chatId)
  },

  deleteChat: async (chatId) => {
    await chatsApi.remove(chatId)
    get().dropChatLocal(chatId)
  },

  bumpMembers: (chatId, delta) => set((s) => ({
    chats: s.chats.map((c) => (c.id === chatId ? { ...c, membersCount: Math.max(0, c.membersCount + delta) } : c)),
  })),

  dropChatLocal: (chatId) => set((s) => {
    const { [chatId]: _m, ...messages } = s.messages
    const { [chatId]: _p, ...pinned } = s.pinned
    return {
      chats: s.chats.filter((c) => c.id !== chatId),
      messages,
      pinned,
      activeChatId: s.activeChatId === chatId ? null : s.activeChatId,
    }
  }),

  // --- live updates from SignalR (edited/deleted/reaction/read) ---
  applyEdited: (m) => {
    set((s) => {
      const list = s.messages[m.chatId]
      // The same event carries pin changes (MessageResponseDto.isPinned), so the pinned
      // bar has to follow it even when the thread itself isn't loaded.
      const cur = s.pinned[m.chatId] ?? []
      const pinnedNext = m.isPinned
        ? (cur.some((x) => x.id === m.id) ? cur.map((x) => (x.id === m.id ? m : x)) : [...cur, m])
            .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
        : cur.filter((x) => x.id !== m.id)
      const pinned = { ...s.pinned, [m.chatId]: pinnedNext }
      if (!list) return { pinned }
      return { messages: { ...s.messages, [m.chatId]: list.map((x) => (x.id === m.id ? m : x)) }, pinned }
    })
  },
  applyDeleted: (messageId) => {
    set((s) => {
      const chatId = findChatIdByMessage(s.messages, messageId)
      if (chatId == null) return {}
      return {
        messages: {
          ...s.messages,
          [chatId]: s.messages[chatId].map((x) => (x.id === messageId ? { ...x, isDeleted: true, content: '' } : x)),
        },
      }
    })
  },
  // The event now carries the whole updated message, so we can replace it outright —
  // no refetch. Only `reactedByMe` is re-derived locally (see withMyReactionFlags).
  applyReactionUpdate: (m) => {
    set((s) => {
      const list = s.messages[m.chatId]
      if (!list) return {}
      const existing = list.find((x) => x.id === m.id)
      if (!existing) return {}
      // If I started this toggle, the broadcast flag was computed for me — trust it.
      const reactions = isMyToggle(m.id)
        ? (m.reactions ?? [])
        : withMyReactionFlags(m, existing).reactions
      myPendingToggles.delete(m.id)
      return {
        messages: { ...s.messages, [m.chatId]: list.map((x) => (x.id === m.id ? { ...x, reactions } : x)) },
      }
    })
  },
  applyReadReceipt: (messageId, userId) => {
    set((s) => {
      const chatId = findChatIdByMessage(s.messages, messageId)
      if (chatId == null) return {}
      const mine = myId()
      return {
        messages: {
          ...s.messages,
          [chatId]: s.messages[chatId].map((x) =>
            x.id === messageId && x.senderId === mine && userId !== mine ? { ...x, status: 'Read' as const } : x),
        },
      }
    })
  },

  sendTyping: (chatId) => { void signalr.typing(chatId) },

  ingestMessage: (m) => {
    set((s) => {
      // Always land the message in the thread — even if it isn't loaded yet. If we drop it
      // here, a live NewMessage for an unopened chat would vanish until a refresh. A thread
      // seeded this way stays flagged as NOT loaded (see openChat), so history still fills in.
      const list = s.messages[m.chatId] ?? []
      let messages = s.messages
      // A pending draft of ours whose echo this is → replace it in place, so the bubble
      // never duplicates when the SignalR echo beats the HTTP response.
      const draftIdx = m.senderId === myId()
        ? list.findIndex((x) => x.pending && x.type === m.type && x.content === m.content)
        : -1
      if (list.some((x) => x.id === m.id)) {
        messages = { ...s.messages, [m.chatId]: list.map((x) => (x.id === m.id ? m : x)) }
      } else if (draftIdx >= 0) {
        messages = { ...s.messages, [m.chatId]: list.map((x, i) => (i === draftIdx ? m : x)) }
      } else {
        messages = { ...s.messages, [m.chatId]: [...list, m] }
      }
      // update chat list preview / unread / order
      const mine = m.senderId === myId()
      const isActive = s.activeChatId === m.chatId
      const preview = {
        senderName: m.senderName,
        content: m.content,
        type: m.type,
        sentAt: m.sentAt,
      }
      let found = false
      let chats = s.chats.map((c) => {
        if (c.id !== m.chatId) return c
        found = true
        return {
          ...c,
          lastMessage: preview,
          unreadCount: mine || isActive || c.isMuted ? 0 : c.unreadCount + 1,
        }
      })
      if (found) {
        // move updated chat to top
        chats = [...chats].sort((a, b) => {
          if (a.id === m.chatId) return -1
          if (b.id === m.chatId) return 1
          return 0
        })
      }
      // clear typing indicator for this sender
      const t = s.typing[m.chatId]
      const typing = t ? { ...s.typing, [m.chatId]: t.filter((e) => e.userId !== m.senderId) } : s.typing
      return { messages, chats, typing }
    })
    // notify listeners about someone else's message (never our own echo)
    if (m.senderId !== myId()) {
      const isActiveChat = get().activeChatId === m.chatId && !document.hidden
      const isMuted = !!get().chats.find((c) => c.id === m.chatId)?.isMuted
      for (const fn of incomingHandlers) { try { fn({ message: m, isActiveChat, isMuted }) } catch { /* never break ingest */ } }
    }
    // auto mark-read if viewing
    if (m.senderId !== myId() && get().activeChatId === m.chatId) get().markRead(m.id)
    // if chat not in list yet, refresh list
    if (!get().chats.some((c) => c.id === m.chatId)) void get().loadChats()
  },

  // Refresh a thread's newest page in place: no loader, no clearing, keeps local
  // drafts and older history. Used for stale-while-revalidate and after reconnects.
  revalidateChat: async (chatId) => {
    try {
      const res = await messagesApi.list(chatId, 1, PAGE)
      const asc = [...res.items].reverse()
      set((st) => {
        const existing = st.messages[chatId] ?? []
        const fresh = new Map(asc.map((m) => [m.id, m]))
        const merged = existing
          .map((m) => (fresh.has(m.id)
            ? (isMyToggle(m.id) ? { ...fresh.get(m.id)!, reactions: m.reactions } : fresh.get(m.id)!)
            : m))
          .concat(asc.filter((m) => !existing.some((e) => e.id === m.id)))
          .sort((a, b) => a.sentAt.localeCompare(b.sentAt) || a.id - b.id)
        return { messages: { ...st.messages, [chatId]: merged } }
      })
    } catch { /* keep cached data */ }
  },

  // Silent revalidation after the hub reconnects: refresh the chat list and the open
  // thread in place, without clearing anything or flashing a loader.
  resyncAll: async () => {
    try {
      const chats = await chatsApi.list()
      set((st) => {
        // keep any optimistic preview that is newer than the server's copy
        const byId = new Map(st.chats.map((c) => [c.id, c]))
        return { chats: chats.map((c) => ({ ...c, unreadCount: byId.get(c.id)?.unreadCount ?? c.unreadCount })) }
      })
      for (const c of chats) void signalr.joinChat(c.id)
    } catch { /* stay on cached data */ }

    const chatId = get().activeChatId
    if (chatId != null) await get().revalidateChat(chatId)
    await get().flushOutbox()   // connection is back — drain anything waiting
  },

  /** Re-insert anything still in the outbox after a reload so it stays visible. */
  hydrateOutbox: () => {
    const items = readOutbox()
    if (!items.length) return
    set((s) => {
      const messages = { ...s.messages }
      for (const it of items) {
        const list = messages[it.chatId] ?? []
        if (list.some((m) => m.id === it.tempId)) continue
        const revived: Message = {
          id: it.tempId, chatId: it.chatId, senderId: myId() ?? 0, senderName: '', senderAvatarUrl: null,
          content: it.content, type: it.type, status: 'Sent', queued: true,
          replyToMessageId: it.replyToMessageId, replyToPreview: it.replyToPreview,
          isEdited: false, isDeleted: false, sentAt: it.sentAt, attachments: [], reactions: [],
        }
        messages[it.chatId] = [...list, revived].sort((a, b) => a.sentAt.localeCompare(b.sentAt) || a.id - b.id)
      }
      return { messages }
    })
  },

  /** Send everything queued, oldest first, stopping at the first transport failure. */
  flushOutbox: async () => {
    if (flushing) return
    const items = readOutbox()
    if (!items.length) return
    flushing = true
    try {
    for (const it of items) {
      set((s) => ({
        messages: {
          ...s.messages,
          [it.chatId]: (s.messages[it.chatId] ?? []).map((m) =>
            m.id === it.tempId ? { ...m, queued: false, pending: true, failed: false } : m),
        },
      }))
      try {
        const msg = await messagesApi.send({
          chatId: it.chatId, content: it.content, type: it.type,
          replyToMessageId: it.replyToMessageId,
        })
        removeFromOutbox(it.tempId)
        set((s) => ({
          messages: {
            ...s.messages,
            [it.chatId]: (s.messages[it.chatId] ?? []).filter((m) => m.id !== it.tempId && m.id !== msg.id),
          },
        }))
        get().ingestMessage(msg)
      } catch (e) {
        if (isRetryable(e)) {
          // still offline — put it back into the waiting state and stop (keep order)
          set((s) => ({
            messages: {
              ...s.messages,
              [it.chatId]: (s.messages[it.chatId] ?? []).map((m) =>
                m.id === it.tempId ? { ...m, pending: false, queued: true } : m),
            },
          }))
          return   // `finally` below releases the flush guard
        }
        // definitive rejection: drop from the queue, surface it on the bubble
        removeFromOutbox(it.tempId)
        set((s) => ({
          messages: {
            ...s.messages,
            [it.chatId]: (s.messages[it.chatId] ?? []).map((m) =>
              m.id === it.tempId ? { ...m, pending: false, queued: false, failed: true } : m),
          },
        }))
      }
    }
    } finally { flushing = false }
  },

  loadPinned: async (chatId) => {
    try {
      const list = await messagesApi.pinned(chatId)
      set((s) => ({ pinned: { ...s.pinned, [chatId]: list } }))
    } catch { /* leave whatever we had */ }
  },

  // Optimistic pin: the bar appears/disappears at once, then reconciles. The server also
  // broadcasts the updated message over "MessageEdited", which keeps other clients in sync.
  togglePin: async (messageId, chatId) => {
    const msg = (get().messages[chatId] ?? []).find((m) => m.id === messageId)
    if (!msg) return
    const next = !msg.isPinned
    const apply = (isPinned: boolean) => set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map((m) => (m.id === messageId ? { ...m, isPinned } : m)),
      },
      pinned: {
        ...s.pinned,
        [chatId]: isPinned
          ? [...(s.pinned[chatId] ?? []).filter((m) => m.id !== messageId), { ...msg, isPinned: true }]
              .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
          : (s.pinned[chatId] ?? []).filter((m) => m.id !== messageId),
      },
    }))
    apply(next)
    try {
      const res = await messagesApi.pin(messageId)
      if (res.isPinned !== next) apply(res.isPinned)
    } catch {
      apply(!next)
      toast(next ? 'Could not pin' : 'Could not unpin')
    }
  },

  forwardMessage: async (messageId, targetChatId) => {
    try {
      const msg = await messagesApi.forward({ messageId, targetChatId })
      get().ingestMessage(msg)
      return msg
    } catch {
      toast('Could not forward the message')
      return null
    }
  },

  loadEvents: async (chatId) => {
    try {
      const evs = await eventsApi.byChat(chatId)
      set((s) => ({ events: { ...s.events, [chatId]: evs } }))
    } catch { /* ignore */ }
  },

  upsertEvent: (ev) => {
    set((s) => {
      const events = { ...s.events }
      let changed = false
      // Keep the card fresh in every list that already shows it (RSVP/EventUpdated).
      for (const key of Object.keys(events)) {
        const cid = Number(key)
        if (events[cid].some((e) => e.id === ev.id)) {
          events[cid] = events[cid].map((e) => (e.id === ev.id ? { ...e, ...ev } : e))
          changed = true
        }
      }
      // Ensure it exists in its target chat (EventShared carries the target chatId;
      // in-chat created events carry their own chatId) — append if not there yet.
      if (ev.chatId != null) {
        const list = events[ev.chatId] ?? []
        if (!list.some((e) => e.id === ev.id)) { events[ev.chatId] = [...list, ev]; changed = true }
      }
      return changed ? { events } : {}
    })
  },

  reset: () => set({
    chats: [], activeChatId: null, messages: {}, msgLoading: {}, msgHasMore: {}, msgPage: {}, msgLoaded: {},
    presence: {}, typing: {}, events: {}, pinned: {},
  }),
}))

/**
 * POST an optimistic draft and reconcile it with the server message.
 * Swaps the temp bubble for the real one (dropping any duplicate the SignalR echo
 * already added). On failure the bubble stays put, flagged `failed` for retry.
 */
async function deliver(chatId: number, draft: Message): Promise<void> {
  try {
    const msg = await messagesApi.send({
      chatId,
      content: draft.content,
      type: draft.type,
      replyToMessageId: draft.replyToMessageId ?? null,
    })
    useChat.setState((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).filter((m) => m.id !== draft.id && m.id !== msg.id),
      },
    }))
    useChat.getState().ingestMessage(msg)
  } catch (e) {
    const queue = isRetryable(e)
    if (queue) {
      addToOutbox({
        tempId: draft.id, chatId, content: draft.content, type: draft.type,
        replyToMessageId: draft.replyToMessageId ?? null,
        replyToPreview: draft.replyToPreview ?? null, sentAt: draft.sentAt,
      })
    }
    useChat.setState((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map((m) =>
          m.id === draft.id ? { ...m, pending: false, failed: !queue, queued: queue } : m),
      },
    }))
  }
}

/* ---------------- SignalR wiring ---------------- */
export function wireRealtime() {
  signalr.setHandlers({
    onNewMessage: (m) => useChat.getState().ingestMessage(m),
    onMessageEdited: (m) => useChat.getState().applyEdited(m),
    onMessageDeleted: (id) => useChat.getState().applyDeleted(id),
    onReactionUpdated: (m) => useChat.getState().applyReactionUpdate(m),
    onMessageRead: (id, userId) => useChat.getState().applyReadReceipt(id, userId),
    // EventShared payload.chatId is the TARGET chat → upsertEvent places the card in the
    // right chat's store live, even if that chat isn't open.
    onEventShared: (ev) => useChat.getState().upsertEvent(ev),
    onEventUpdated: (ev) => useChat.getState().upsertEvent(ev),
    onUserOnline: (userId) => useChat.setState((s) => ({
      presence: { ...s.presence, [userId]: { online: true } },
    })),
    onUserOffline: (userId, lastSeenAt) => useChat.setState((s) => ({
      presence: { ...s.presence, [userId]: { online: false, lastSeenAt } },
    })),
    onUserTyping: (chatId, userId) => {
      if (userId === myId()) return
      const st = useChat.getState()
      const existing = st.typing[chatId] ?? []
      const prev = existing.find((e) => e.userId === userId)
      if (prev) window.clearTimeout(prev.timer)
      const timer = window.setTimeout(() => {
        useChat.setState((s) => ({
          typing: { ...s.typing, [chatId]: (s.typing[chatId] ?? []).filter((e) => e.userId !== userId) },
        }))
      }, 3500)
      useChat.setState((s) => ({
        typing: {
          ...s.typing,
          [chatId]: [...(s.typing[chatId] ?? []).filter((e) => e.userId !== userId), { userId, timer }],
        },
      }))
    },
    onStateChange: (connected) => useChat.setState({ hubConnected: connected }),
  })
}

export const previewText = (c: Chat): string => {
  if (!c.lastMessage) return 'No messages yet'
  const t = c.lastMessage.type
  if (t === 'Text') return c.lastMessage.content || ''
  const label = MessageTypeE.names.includes(t as any) ? t : 'Message'
  const map: Record<string, string> = {
    Image: '📷 Photo', Video: '🎬 Video', File: '📎 File', Voice: '🎙 Voice message',
    Sticker: 'Sticker', Gift: '🎁 Gift', System: c.lastMessage.content || '',
  }
  return map[label] ?? c.lastMessage.content ?? ''
}
