import { create } from 'zustand'
import { chatsApi, messagesApi } from '../lib/api'
import { signalr } from '../lib/signalr'
import { tokenStore } from '../lib/tokenStore'
import type { Chat, Message } from '../lib/types'
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

  presence: Record<number, { online: boolean; lastSeenAt?: string }>
  typing: Record<number, TypingEntry[]>      // chatId -> typing users

  hubConnected: boolean

  loadChats: () => Promise<void>
  openChat: (chatId: number) => Promise<void>
  closeChat: (chatId: number) => void
  loadMore: (chatId: number) => Promise<void>
  send: (chatId: number, content: string, replyToMessageId?: number | null) => Promise<void>
  edit: (messageId: number, chatId: number, content: string) => Promise<void>
  remove: (messageId: number, chatId: number) => Promise<void>
  react: (messageId: number, chatId: number, emoji: string) => Promise<void>
  markRead: (messageId: number) => void
  sendTyping: (chatId: number) => void
  ingestMessage: (m: Message) => void
  applyEdited: (m: Message) => void
  applyDeleted: (messageId: number) => void
  applyReactionUpdate: (messageId: number) => Promise<void>
  applyReadReceipt: (messageId: number, userId: number) => void
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

export const useChat = create<ChatState>((set, get) => ({
  chats: [],
  chatsLoading: false,
  chatsError: null,
  activeChatId: null,
  messages: {},
  msgLoading: {},
  msgHasMore: {},
  msgPage: {},
  presence: {},
  typing: {},
  hubConnected: false,

  loadChats: async () => {
    set({ chatsLoading: true, chatsError: null })
    try {
      const chats = await chatsApi.list()
      set({ chats, chatsLoading: false })
    } catch (e: any) {
      set({ chatsLoading: false, chatsError: e?.message ?? 'Failed to load chats' })
    }
  },

  openChat: async (chatId) => {
    set({ activeChatId: chatId })
    void signalr.joinChat(chatId)
    // clear local unread
    set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)) }))
    if (get().messages[chatId]) return
    set((s) => ({ msgLoading: { ...s.msgLoading, [chatId]: true } }))
    try {
      const res = await messagesApi.list(chatId, 1, PAGE)
      const asc = [...res.items].reverse()
      set((s) => ({
        messages: { ...s.messages, [chatId]: asc },
        msgLoading: { ...s.msgLoading, [chatId]: false },
        msgHasMore: { ...s.msgHasMore, [chatId]: res.items.length >= PAGE && asc.length < res.totalCount },
        msgPage: { ...s.msgPage, [chatId]: 1 },
      }))
      // mark newest incoming as read
      const last = asc[asc.length - 1]
      if (last && last.senderId !== myId()) get().markRead(last.id)
    } catch {
      set((s) => ({ msgLoading: { ...s.msgLoading, [chatId]: false } }))
    }
  },

  closeChat: (chatId) => {
    if (get().activeChatId === chatId) set({ activeChatId: null })
    void signalr.leaveChat(chatId)
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

  send: async (chatId, content, replyToMessageId) => {
    const msg = await messagesApi.send({ chatId, content, type: 'Text', replyToMessageId: replyToMessageId ?? null })
    get().ingestMessage(msg)
  },

  edit: async (messageId, chatId, content) => {
    const updated = await messagesApi.edit({ messageId, content })
    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map((m) => (m.id === messageId ? updated : m)),
      },
    }))
  },

  remove: async (messageId, chatId) => {
    await messagesApi.remove(messageId)
    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: '' } : m),
      },
    }))
  },

  react: async (messageId, chatId, emoji) => {
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
    try {
      await messagesApi.react({ messageId, emoji })
    } catch {
      // resync this chat's first page on failure
      try {
        const res = await messagesApi.list(chatId, 1, PAGE)
        const asc = [...res.items].reverse()
        set((s) => {
          const existing = s.messages[chatId] ?? []
          const older = existing.filter((m) => !asc.some((a) => a.id === m.id) && m.id < (asc[0]?.id ?? Infinity))
          return { messages: { ...s.messages, [chatId]: [...older, ...asc] } }
        })
      } catch { /* ignore */ }
    }
  },

  markRead: (messageId) => { void messagesApi.markRead(messageId).catch(() => {}) },

  // --- live updates from SignalR (edited/deleted/reaction/read) ---
  applyEdited: (m) => {
    set((s) => {
      const list = s.messages[m.chatId]
      if (!list) return {}
      return { messages: { ...s.messages, [m.chatId]: list.map((x) => (x.id === m.id ? m : x)) } }
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
  applyReactionUpdate: async (messageId) => {
    const chatId = findChatIdByMessage(get().messages, messageId)
    if (chatId == null) return
    // Backend event carries only messageId; refetch the loaded page to get fresh reaction counts.
    try {
      const res = await messagesApi.list(chatId, 1, PAGE)
      const fresh = new Map(res.items.map((m) => [m.id, m]))
      set((s) => ({
        messages: {
          ...s.messages,
          [chatId]: (s.messages[chatId] ?? []).map((x) => (fresh.has(x.id) ? { ...x, reactions: fresh.get(x.id)!.reactions } : x)),
        },
      }))
    } catch { /* ignore */ }
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
      const list = s.messages[m.chatId]
      let messages = s.messages
      if (list) {
        if (list.some((x) => x.id === m.id)) {
          messages = { ...s.messages, [m.chatId]: list.map((x) => (x.id === m.id ? m : x)) }
        } else {
          messages = { ...s.messages, [m.chatId]: [...list, m] }
        }
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
          unreadCount: mine || isActive ? 0 : c.unreadCount + 1,
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
    // auto mark-read if viewing
    if (m.senderId !== myId() && get().activeChatId === m.chatId) get().markRead(m.id)
    // if chat not in list yet, refresh list
    if (!get().chats.some((c) => c.id === m.chatId)) void get().loadChats()
  },

  reset: () => set({
    chats: [], activeChatId: null, messages: {}, msgLoading: {}, msgHasMore: {}, msgPage: {},
    presence: {}, typing: {},
  }),
}))

/* ---------------- SignalR wiring ---------------- */
export function wireRealtime() {
  signalr.setHandlers({
    onNewMessage: (m) => useChat.getState().ingestMessage(m),
    onMessageEdited: (m) => useChat.getState().applyEdited(m),
    onMessageDeleted: (id) => useChat.getState().applyDeleted(id),
    onReactionUpdated: (id) => void useChat.getState().applyReactionUpdate(id),
    onMessageRead: (id, userId) => useChat.getState().applyReadReceipt(id, userId),
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
