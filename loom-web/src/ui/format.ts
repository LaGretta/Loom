// Small formatting helpers: relative time, avatar gradients, initials, presence.
import type { UserStatus } from '../lib/enums'

export function initials(name: string): string {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Deterministic gradient per user (the design's colorful avatar exception).
const GRADIENTS = [
  ['#6E5DD6', '#3A2E7A'], ['#4E63C4', '#1C2456'], ['#C4552E', '#4E2626'],
  ['#2E9C90', '#1E4A52'], ['#A6763A', '#443428'], ['#2EA69A', '#164A48'],
  ['#C4468E', '#4A2044'], ['#C99A3A', '#3E3220'], ['#2E9C5A', '#154A2E'],
  ['#E0774A', '#5E2E32'], ['#3E9A80', '#1E4A40'], ['#4C8DC4', '#243E5E'],
]
export function avatarGradient(seed: number | string): string {
  let n = 0
  const s = String(seed)
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0
  const [a, b] = GRADIENTS[n % GRADIENTS.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

export function timeShort(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function chatListTime(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' })
}

export function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = now.toDateString() === d.toDateString()
  const yst = new Date(now.getTime() - 86400000).toDateString() === d.toDateString()
  if (today) return 'Today'
  if (yst) return 'Yesterday'
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

// Graded "last seen …" text for an offline user (English).
export function lastSeen(iso?: string | null): string {
  if (!iso) return 'last seen recently'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'last seen recently'
  const diff = Date.now() - d.getTime()
  if (diff < 0) return 'last seen just now'         // clock skew → treat as just now
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'last seen just now'
  if (min < 60) return `last seen ${min} minute${min === 1 ? '' : 's'} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `last seen ${hr} hour${hr === 1 ? '' : 's'} ago`
  const days = Math.floor(hr / 24)
  if (days < 7) return `last seen ${days} day${days === 1 ? '' : 's'} ago`
  return `last seen on ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
}

/**
 * The single source of truth for presence text shown anywhere a user's status appears.
 * `live` is the realtime presence entry from the SignalR store (fresher than the REST status)
 * and, when present, wins. Invisible reads as offline to other users.
 */
export function presenceText(
  status: UserStatus | undefined,
  lastSeenAt?: string | null,
  live?: { online: boolean; lastSeenAt?: string } | null,
): string {
  if (live) return live.online ? 'online' : lastSeen(live.lastSeenAt ?? lastSeenAt)
  switch (status) {
    case 'Online': return 'online'
    case 'Away': return 'away'
    case 'Busy': return 'busy'
    default: return lastSeen(lastSeenAt)   // Offline & Invisible
  }
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fmtNumber(n: number | null | undefined): string {
  // A renamed or absent field should read as 0, not take the whole screen down.
  return Number.isFinite(n as number) ? (n as number).toLocaleString('en-US') : '0'
}
