/* Enum handling.
 * ⚠️ API MISMATCH: the handoff said "enums come as STRINGS", but the backend has NO
 * JsonStringEnumConverter configured, so System.Text.Json serializes enums as INTEGERS.
 * To be robust either way we: (a) SEND numeric ordinals (always accepted by the default
 * converter, and also by JsonStringEnumConverter if it's ever added), and (b) NORMALIZE
 * received values from number-or-string into canonical string labels below.
 * Ordinals mirror Loom.Domain.Enums (0-based, declaration order). */

const ORD = <T extends string>(names: readonly T[]) => {
  const byName = new Map<string, T>(names.map((n) => [n.toLowerCase(), n]))
  return {
    names,
    /** number-or-string from the API -> canonical label */
    from(v: unknown, fallback: T): T {
      if (typeof v === 'number' && names[v] !== undefined) return names[v]
      if (typeof v === 'string') {
        const hit = byName.get(v.toLowerCase())
        if (hit) return hit
        const asNum = Number(v)
        if (!Number.isNaN(asNum) && names[asNum] !== undefined) return names[asNum]
      }
      return fallback
    },
    /** canonical label -> numeric ordinal for sending */
    ord(label: T): number {
      return names.indexOf(label)
    },
  }
}

export const ChatTypeE = ORD(['Direct', 'Group', 'Channel'] as const)
export type ChatType = (typeof ChatTypeE.names)[number]

export const MemberRoleE = ORD(['Member', 'Admin', 'Owner'] as const)
export type MemberRole = (typeof MemberRoleE.names)[number]

export const MessageStatusE = ORD(['Sent', 'Delivered', 'Read'] as const)
export type MessageStatus = (typeof MessageStatusE.names)[number]

export const MessageTypeE = ORD(['Text', 'Image', 'Video', 'File', 'Voice', 'Sticker', 'Gift', 'System'] as const)
export type MessageType = (typeof MessageTypeE.names)[number]

export const PremiumTierE = ORD(['None', 'Premium'] as const)
export type PremiumTier = (typeof PremiumTierE.names)[number]

export const StarTxTypeE = ORD(['Purchase', 'GiftSent', 'GiftReceived', 'PremiumPurchase', 'AdminGrant', 'Refund'] as const)
export type StarTxType = (typeof StarTxTypeE.names)[number]

export const UserStatusE = ORD(['Offline', 'Online', 'Away', 'Busy', 'Invisible'] as const)
export type UserStatus = (typeof UserStatusE.names)[number]

export const AttachmentTypeE = ORD(['Image', 'Video', 'File', 'Audio'] as const)
export type AttachmentType = (typeof AttachmentTypeE.names)[number]

export const isOnline = (s: UserStatus) => s === 'Online' || s === 'Away' || s === 'Busy'
