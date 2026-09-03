import { http } from './http'
import { tokenStore } from './tokenStore'
import {
  ChatTypeE, MessageTypeE, type ChatType, type MessageType,
} from './enums'
import {
  type AuthResponse, type UserProfile, type UserSummary, type Chat, type ChatMember,
  type Message, type Paged, type StarBalance, type StarTransaction, type GiftCatalogItem, type GiftInstance,
  normUser, normUserSummary, normChat, normMember, normMessage, normBalance, normTx,
} from './types'

/* ---------------- Auth ---------------- */
export const authApi = {
  register: (b: { userName: string; displayName: string; email: string; password: string }) =>
    http.post<AuthResponse>('/api/auth/register', b, { auth: false }),
  login: (b: { email: string; password: string }) =>
    http.post<AuthResponse>('/api/auth/login', b, { auth: false }),
  // raw JSON string body per backend contract
  logout: (refreshToken: string) =>
    http.post<void>('/api/auth/logout', JSON.stringify(refreshToken), { auth: false, raw: true }),
}

/* ---------------- Users ---------------- */
export const usersApi = {
  me: () => http.get<any>('/api/users/me').then(normUser),
  update: (b: { displayName: string; bio?: string | null }) =>
    http.put<any>('/api/users/me', b).then(normUser),
  byId: (id: number) => http.get<any>(`/api/users/${id}`).then(normUser),
  search: (query: string) =>
    http.get<any[]>(`/api/users/search?query=${encodeURIComponent(query)}`).then((r) => r.map(normUserSummary)),
}

/* ---------------- Chats ---------------- */
export const chatsApi = {
  create: (b: { type: ChatType; title?: string | null; description?: string | null; memberUserIds: number[] }) =>
    http.post<any>('/api/chats', { ...b, type: ChatTypeE.ord(b.type) }).then(normChat),
  list: () => http.get<any[]>('/api/chats').then((r) => r.map(normChat)),
  byId: (id: number) => http.get<any>(`/api/chats/${id}`).then(normChat),
  join: (id: number) => http.post<void>(`/api/chats/${id}/join`),
  leave: (id: number) => http.post<void>(`/api/chats/${id}/leave`),
  members: (id: number) => http.get<any[]>(`/api/chats/${id}/members`).then((r) => r.map(normMember)),
}

/* ---------------- Messages ---------------- */
export const messagesApi = {
  send: (b: { chatId: number; content: string; type?: MessageType; replyToMessageId?: number | null }) =>
    http.post<any>('/api/messages', {
      chatId: b.chatId,
      content: b.content,
      type: MessageTypeE.ord(b.type ?? 'Text'),
      replyToMessageId: b.replyToMessageId ?? null,
    }).then(normMessage),
  list: (chatId: number, page = 1, pageSize = 30) =>
    http.get<Paged<any>>(`/api/messages/chat/${chatId}?page=${page}&pageSize=${pageSize}`).then((r) => ({
      ...r,
      items: r.items.map(normMessage),
    }) as Paged<Message>),
  edit: (b: { messageId: number; content: string }) => http.put<any>('/api/messages', b).then(normMessage),
  remove: (id: number) => http.del<void>(`/api/messages/${id}`),
  markRead: (id: number) => http.post<void>(`/api/messages/${id}/read`),
  react: (b: { messageId: number; emoji: string }) => http.post<any>('/api/messages/reaction', b),
}

/* ---------------- Stars ---------------- */
export const starsApi = {
  balance: () => http.get<any>('/api/stars/balance').then(normBalance),
  history: (page = 1, pageSize = 30) =>
    http.get<Paged<any>>(`/api/stars/history?page=${page}&pageSize=${pageSize}`).then((r) => ({
      ...r,
      items: r.items.map(normTx),
    }) as Paged<StarTransaction>),
  purchase: (amount: number) => http.post<any>('/api/stars/purchase', { amount }).then(normBalance),
}

/* ---------------- Gifts ---------------- */
export const giftsApi = {
  catalog: () => http.get<GiftCatalogItem[]>('/api/gifts/catalog'),
  send: (b: { giftId: number; receiverId: number; chatId?: number | null }) =>
    http.post<GiftInstance>('/api/gifts/send', b),
  mine: () => http.get<GiftInstance[]>('/api/gifts/my'),
}

/* ---------------- Media ---------------- */
export const mediaApi = {
  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return http.post<{ url: string }>('/api/media/upload', fd)
  },
}

/* ---------------- convenience ---------------- */
export async function logoutEverywhere() {
  const rt = tokenStore.refresh
  try { if (rt) await authApi.logout(rt) } catch { /* ignore */ }
  tokenStore.clear()
}

export type { AuthResponse, UserProfile, UserSummary, Chat, ChatMember, Message, Paged, StarBalance, StarTransaction, GiftCatalogItem, GiftInstance }
