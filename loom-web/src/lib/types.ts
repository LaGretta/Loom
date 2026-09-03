import {
  type ChatType, type MemberRole, type MessageStatus, type MessageType,
  type PremiumTier, type StarTxType, type UserStatus, type AttachmentType,
  ChatTypeE, MemberRoleE, MessageStatusE, MessageTypeE, PremiumTierE, StarTxTypeE, UserStatusE, AttachmentTypeE,
} from './enums'

/* ---------- Auth ---------- */
export interface AuthResponse {
  id: number
  userName: string
  displayName: string
  email: string
  token: string        // ⚠️ backend field is `token`, not `accessToken`
  refreshToken: string
}

/* ---------- Users ---------- */
export interface UserProfile {
  id: number
  userName: string
  displayName: string
  bio?: string | null
  avatarUrl?: string | null
  status: UserStatus
  lastSeenAt: string
  premiumTier: PremiumTier
}
export interface UserSummary {
  id: number
  userName: string
  displayName: string
  avatarUrl?: string | null
  status: UserStatus
  premiumTier: PremiumTier
}

/* ---------- Chats ---------- */
export interface MessagePreview {
  senderName: string
  content: string
  type: MessageType
  sentAt: string
}
export interface Chat {
  id: number
  type: ChatType
  title?: string | null
  avatarUrl?: string | null
  membersCount: number
  lastMessage?: MessagePreview | null
  unreadCount: number
}
export interface ChatMember {
  userId: number
  userName: string
  displayName: string
  avatarUrl?: string | null
  role: MemberRole
  status: UserStatus
}

/* ---------- Messages ---------- */
export interface Attachment {
  id: number
  type: AttachmentType
  url: string
  fileName: string
  fileSizeBytes: number
}
export interface Reaction {
  emoji: string
  count: number
  reactedByMe: boolean
}
export interface Message {
  id: number
  chatId: number
  senderId: number
  senderName: string
  senderAvatarUrl?: string | null
  content: string
  type: MessageType
  status: MessageStatus
  replyToMessageId?: number | null
  replyToPreview?: string | null
  isEdited: boolean
  isDeleted: boolean
  sentAt: string
  attachments: Attachment[]
  reactions: Reaction[]
}
export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages?: number
}

/* ---------- Stars ---------- */
export interface StarBalance {
  balance: number
  premiumTier: PremiumTier
  premiumUntil?: string | null
}
export interface StarTransaction {
  id: number
  type: StarTxType
  amount: number
  balanceAfter: number
  createdAt: string
}

/* ---------- Gifts ---------- */
export interface GiftCatalogItem {
  id: number
  name: string
  imageUrl: string
  starCost: number
}
export interface GiftInstance {
  id: number
  giftName: string
  giftImageUrl: string
  senderId: number
  senderName: string
  receiverId: number
  sentAt: string
}

/* ---------- Normalizers: coerce raw API JSON (numbers-or-strings) into typed models ---------- */
export const normUser = (r: any): UserProfile => ({
  ...r,
  status: UserStatusE.from(r?.status, 'Offline'),
  premiumTier: PremiumTierE.from(r?.premiumTier, 'None'),
})
export const normUserSummary = (r: any): UserSummary => ({
  ...r,
  status: UserStatusE.from(r?.status, 'Offline'),
  premiumTier: PremiumTierE.from(r?.premiumTier, 'None'),
})
export const normChat = (r: any): Chat => ({
  ...r,
  type: ChatTypeE.from(r?.type, 'Direct'),
  lastMessage: r?.lastMessage
    ? { ...r.lastMessage, type: MessageTypeE.from(r.lastMessage.type, 'Text') }
    : null,
})
export const normMember = (r: any): ChatMember => ({
  ...r,
  role: MemberRoleE.from(r?.role, 'Member'),
  status: UserStatusE.from(r?.status, 'Offline'),
})
export const normMessage = (r: any): Message => ({
  ...r,
  type: MessageTypeE.from(r?.type, 'Text'),
  status: MessageStatusE.from(r?.status, 'Sent'),
  attachments: (r?.attachments ?? []).map((a: any) => ({ ...a, type: AttachmentTypeE.from(a?.type, 'File') })),
  reactions: r?.reactions ?? [],
})
export const normBalance = (r: any): StarBalance => ({
  ...r,
  premiumTier: PremiumTierE.from(r?.premiumTier, 'None'),
})
export const normTx = (r: any): StarTransaction => ({
  ...r,
  type: StarTxTypeE.from(r?.type, 'Purchase'),
})
