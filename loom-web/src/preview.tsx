/* TEMPORARY harness — deleted after the sweep. */
import ReactDOM from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import './theme/tokens.css'
import './theme/global.css'
import './ui/app.css'
import { injectAllDefs } from './assets/loom'
import { useAuth } from './store/auth'
import { useChat } from './store/chat'
import { tokenStore } from './lib/tokenStore'
import App from './App'
import * as audit from './audit'
import type { Chat, Message } from './lib/types'

injectAllDefs(document)
const iso = (m: number) => new Date(Date.now() - m * 60000).toISOString()
const json = (b: unknown, status = 200) =>
  Promise.resolve(new Response(status === 204 ? null : JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } }))

const IMG = (s: string) => `https://picsum.photos/seed/${s}/900/600`
const unhandled: string[] = []
;(window as any).__unhandled = unhandled
;(window as any).__audit = audit

const me = { id: 1, userName: 'you', displayName: 'You', bio: 'Building Loom.', avatarUrl: null, status: 'Online', lastSeenAt: iso(0), premiumTier: 'Premium' }
const users: any = {
  2: { id: 2, userName: 'kate', displayName: 'Kateryna Bondarenko', bio: 'Designer. Radii enthusiast.', avatarUrl: null, status: 'Online', lastSeenAt: iso(0), premiumTier: 'Premium' },
  3: { id: 3, userName: 'andrii', displayName: 'Andrii', bio: null, avatarUrl: null, status: 'Offline', lastSeenAt: iso(200), premiumTier: 'None' },
  4: { id: 4, userName: 'bohdan', displayName: 'Bohdan Kovalenko', bio: 'Backend.', avatarUrl: null, status: 'Online', lastSeenAt: iso(0), premiumTier: 'None' },
}

const mk = (id: number, chatId: number, senderId: number, content: string, minsAgo: number, extra: any = {}) => ({
  id, chatId, senderId, senderName: senderId === 1 ? 'You' : (users[senderId]?.displayName ?? 'Someone'),
  senderAvatarUrl: null, content, type: 0, status: 2, replyToMessageId: null, replyToPreview: null, replyToSenderName: null,
  forwardedFromSenderName: null, isEdited: false, isDeleted: false, isPinned: false, sentAt: iso(minsAgo),
  attachments: [], reactions: [], ...extra,
})

const thread: Record<number, any[]> = {
  1: [
    mk(101, 1, 2, 'Morning! Pushed the new radii scale.', 600),
    mk(102, 1, 1, 'Nice — the 26px on the islands finally reads right.', 590),
    mk(103, 1, 2, IMG('a'), 500, { type: 1 }),
    mk(104, 1, 3, 'Can we get the spec as a file?', 420),
    mk(105, 1, 2, 'https://cdn.example.com/loom%20spec%20sheet.pdf', 410, { type: 3, attachments: [{ id: 1, type: 2, url: 'x', fileName: 'loom spec sheet.pdf', fileSizeBytes: 284000 }] }),
    mk(106, 1, 1, 'Here you go', 400, { isPinned: true, reactions: [{ emoji: '👍', count: 3, reactedByMe: true }, { emoji: '🔥', count: 1, reactedByMe: false }] }),
    mk(107, 1, 4, 'This is a much longer message that should wrap across several lines so we can see how the bubble behaves with real paragraph-length content instead of the usual two-word test strings.', 300),
    mk(108, 1, 2, IMG('b'), 200, { type: 1 }),
    mk(109, 1, 1, 'https://example.com/voice.webm', 120, { type: 4 }),
    mk(110, 1, 3, 'Replying to the long one', 60, { replyToMessageId: 107, replyToPreview: 'This is a much longer message', replyToSenderName: 'Bohdan Kovalenko' }),
    mk(111, 1, 2, 'Forwarded note', 30, { forwardedFromSenderName: 'Kateryna Bondarenko' }),
    mk(112, 1, 1, 'Edited this one', 20, { isEdited: true }),
    mk(113, 1, 2, 'Deleted', 10, { isDeleted: true }),
    mk(114, 1, 1, 'Last word.', 4),
  ],
  2: [mk(201, 2, 3, 'ok', 30), mk(202, 2, 1, 'thanks', 20)],
  3: [mk(301, 3, 4, 'Channel announcement: v1 ships Friday.', 100)],
}

const chatsRaw: any[] = [
  { id: 1, type: 1, title: 'Design Guild', description: 'Where the design team argues about radii.', avatarUrl: null, membersCount: 4, unreadCount: 3, isMuted: false, myRole: 2, lastMessage: { senderName: 'You', content: 'Last word.', type: 0, sentAt: iso(4) } },
  { id: 2, type: 0, title: 'Andrii', description: null, avatarUrl: null, membersCount: 2, unreadCount: 0, isMuted: true, myRole: 0, lastMessage: { senderName: 'You', content: 'thanks', type: 0, sentAt: iso(20) } },
  { id: 3, type: 2, title: 'Loom Announcements', description: 'Product news.', avatarUrl: null, membersCount: 128, unreadCount: 12, isMuted: false, myRole: 0, lastMessage: { senderName: 'Bohdan Kovalenko', content: 'Channel announcement: v1 ships Friday.', type: 0, sentAt: iso(100) } },
  { id: 4, type: 0, title: 'Kateryna Bondarenko', description: null, avatarUrl: null, membersCount: 2, unreadCount: 0, isMuted: false, myRole: 0, lastMessage: { senderName: 'Kateryna Bondarenko', content: 'Voice message', type: 4, sentAt: iso(1500) } },
]

const S: any = {
  calls: [] as string[],
  invites: [
    { code: 'aB3xK9pQ', createdAt: iso(600), expiresAt: null, maxUses: null, uses: 7, isActive: true },
    { code: 'Zq7Lm2Vt', createdAt: iso(3000), expiresAt: new Date(Date.now() + 3 * 864e5).toISOString(), maxUses: 10, uses: 3, isActive: true },
    { code: 'Old4Code', createdAt: iso(9000), expiresAt: new Date(Date.now() - 864e5).toISOString(), maxUses: 1, uses: 1, isActive: false },
  ],
}
;(window as any).__S = S
const realFetch = window.fetch.bind(window)

window.fetch = ((input: any, init?: any) => {
  const url = String(typeof input === 'string' ? input : (input?.url ?? ''))
  const method = (init?.method ?? 'GET').toUpperCase()
  const path = url.replace(/^.*\/api/, '/api')
  S.calls.push(method + ' ' + path)

  if (path === '/api/users/me') return json(me)
  if (/\/api\/users\/search/.test(path)) return json(Object.values(users).map((u: any) => ({ id: u.id, userName: u.userName, displayName: u.displayName, avatarUrl: null, status: u.status, premiumTier: u.premiumTier })))
  const uid = path.match(/^\/api\/users\/(\d+)$/)
  if (uid) return json(users[uid[1]] ?? me)
  if (/\/api\/users\/\d+\/gifts$/.test(path)) return json([
    { id: 1, giftId: 1, name: 'Poor Rabbit', imageUrl: '', starCost: 1500, receivedAt: iso(400), senderName: 'Kateryna' },
    { id: 2, giftId: 2, name: 'Happy Rabbit', imageUrl: '', starCost: 1500, receivedAt: iso(900), senderName: 'Andrii' },
  ])

  if (path === '/api/chats' && method === 'GET') return json(chatsRaw)
  const cid = path.match(/^\/api\/chats\/(\d+)$/)
  if (cid && method === 'GET') return json(chatsRaw.find((c: any) => c.id === Number(cid[1])) ?? chatsRaw[0])
  if (cid) return json(null, 204)
  if (/\/api\/chats\/\d+\/members$/.test(path)) return json([
    { userId: 1, userName: 'you', displayName: 'You', avatarUrl: null, role: 2, status: 1, lastSeenAt: iso(0) },
    { userId: 2, userName: 'kate', displayName: 'Kateryna Bondarenko', avatarUrl: null, role: 1, status: 1, lastSeenAt: iso(0) },
    { userId: 3, userName: 'andrii', displayName: 'Andrii', avatarUrl: null, role: 0, status: 0, lastSeenAt: iso(200) },
    { userId: 4, userName: 'bohdan', displayName: 'Bohdan Kovalenko', avatarUrl: null, role: 0, status: 1, lastSeenAt: iso(0) },
  ])
  if (/\/api\/chats\/\d+\/invites$/.test(path) && method === 'GET') return json(S.invites)
  if (/\/api\/chats\/\d+\/invites$/.test(path) && method === 'POST') return json(S.invites[0])
  if (/\/api\/chats\/invites\/[^/]+$/.test(path) && method === 'GET')
    return json({ chatId: 1, title: 'Design Guild', description: 'Where the design team argues about radii.', avatarUrl: null, membersCount: 4, alreadyMember: false })
  if (/\/api\/chats\/invites\//.test(path)) return json(chatsRaw[0])
  if (/\/api\/chats\/\d+\/(read|mute|join|leave)$/.test(path)) return json({ isMuted: false })

  const hist = path.match(/\/api\/messages\/chat\/(\d+)\?page=(\d+)/)
  if (hist) {
    const c = Number(hist[1]); const page = Number(hist[2])
    const items = page === 1 ? (thread[c] ?? []).slice().reverse() : []
    return json({ items, page, pageSize: 30, totalCount: items.length })
  }
  if (/\/pinned$/.test(path)) return json([thread[1][5]])
  if (path === '/api/messages' && method === 'POST') {
    const b = JSON.parse(init.body)
    return json({ ...mk(90000 + Math.floor(Math.random() * 9999), b.chatId, 1, b.content, 0), type: b.type ?? 0, replyToMessageId: b.replyToMessageId ?? null })
  }
  if (/\/api\/messages\/\d+\/pin$/.test(path)) return json({ isPinned: true })
  if (path === '/api/messages/reaction') return json(thread[1][1])
  if (path === '/api/messages/forward') return json(thread[1][1])
  if (path === '/api/media/upload') return json({ url: IMG('up') })

  if (path === '/api/stars/balance') return json({ balance: 12450, lifetimeEarned: 30000, lifetimeSpent: 17550 })
  if (/\/api\/stars\/history/.test(path)) return json({ items: [
    { id: 1, type: 0, amount: 5000, description: 'Star pack', createdAt: iso(60) },
    { id: 2, type: 1, amount: -1500, description: 'Poor Rabbit to Kateryna', createdAt: iso(300) },
    { id: 3, type: 2, amount: 1500, description: 'Happy Rabbit from Andrii', createdAt: iso(900) },
    { id: 4, type: 3, amount: -2000, description: 'Premium 3 months', createdAt: iso(4000) },
  ], page: 1, pageSize: 30, totalCount: 4 })
  if (path === '/api/gifts/catalog') return json([
    { id: 1, name: 'Poor Rabbit', imageUrl: '', starCost: 1500, description: 'A rabbit having a rough week.' },
    { id: 2, name: 'Happy Rabbit', imageUrl: '', starCost: 1500, description: 'A rabbit having a great week.' },
    { id: 3, name: 'Golden Loomi', imageUrl: '', starCost: 5000, description: 'The rarest weave.' },
    { id: 4, name: 'Star Cluster', imageUrl: '', starCost: 800, description: 'A handful of light.' },
    { id: 5, name: 'Silk Ribbon', imageUrl: '', starCost: 300, description: 'Simple and kind.' },
    { id: 6, name: 'Crystal Gem', imageUrl: '', starCost: 2400, description: 'Refracts everything.' },
  ])
  if (path === '/api/gifts/my') return json([
    { id: 1, giftId: 1, name: 'Poor Rabbit', imageUrl: '', starCost: 1500, receivedAt: iso(400), senderName: 'Kateryna' },
    { id: 2, giftId: 2, name: 'Happy Rabbit', imageUrl: '', starCost: 1500, receivedAt: iso(900), senderName: 'Andrii' },
    { id: 3, giftId: 4, name: 'Star Cluster', imageUrl: '', starCost: 800, receivedAt: iso(2000), senderName: 'Bohdan' },
  ])
  if (path === '/api/premium/plans') return json([
    { name: '1 Month', months: 1, starCost: 800 }, { name: '3 Months', months: 3, starCost: 2000 }, { name: '12 Months', months: 12, starCost: 6500 },
  ])
  if (path === '/api/premium/status') return json({ tier: 1, until: new Date(Date.now() + 40 * 864e5).toISOString(), isActive: true })
  if (path === '/api/events/my' || /\/api\/events\/chat\//.test(path)) return json([
    { id: 1, title: 'Design review', description: 'Radii, again.', eventDateTime: new Date(Date.now() + 2 * 864e5).toISOString(), chatId: 1, createdById: 2, createdByName: 'Kateryna', rsvps: [{ userId: 1, status: 0 }, { userId: 2, status: 1 }] },
    { id: 2, title: 'Ship v1', description: null, eventDateTime: new Date(Date.now() + 9 * 864e5).toISOString(), chatId: 1, createdById: 1, createdByName: 'You', rsvps: [] },
  ])
  if (url.includes('/hubs')) return Promise.reject(new TypeError('preview: no hub'))
  if (path.startsWith('/api/')) { unhandled.push(method + ' ' + path); return json([]) }
  return realFetch(input, init)
}) as typeof fetch

const q = new URLSearchParams(location.search)
if (q.get('anon') === '1') { tokenStore.clear() }
else {
  tokenStore.setTokens('fake', 'fake')
  tokenStore.setUser({ id: 1, userName: 'you', displayName: 'You', email: 'you@example.com' })
}
if (q.get('empty') === '1') chatsRaw.length = 0

const CT = ['Direct', 'Group', 'Channel'] as const
const MR = ['Member', 'Admin', 'Owner'] as const
const MT = ['Text', 'Image', 'Video', 'File', 'Voice', 'Sticker', 'Gift', 'System'] as const
const norm = (r: any): Chat => ({ ...r, type: CT[r.type], myRole: MR[r.myRole] })
const normMsg = (r: any): Message => ({ ...r, type: MT[r.type], status: 'Read' })

useChat.setState({
  chats: chatsRaw.map(norm), chatsLoading: false, chatsError: null, activeChatId: 1, hubConnected: true,
  messages: { 1: thread[1].map(normMsg), 2: thread[2].map(normMsg), 3: thread[3].map(normMsg) },
  msgLoaded: { 1: true, 2: true, 3: true }, msgLoading: {}, msgHasMore: { 1: false, 2: false, 3: false },
  msgPage: { 1: 1, 2: 1, 3: 1 }, events: {}, pinned: { 1: [normMsg(thread[1][5])] },
  presence: { 2: { online: true }, 4: { online: true } },
} as any)
;(window as any).__chat = useChat
;(window as any).__auth = useAuth

const start = location.hash.slice(1) || '/'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <MemoryRouter initialEntries={[start]}><App /></MemoryRouter>)

const ROUTES = ['/', '/chat/1', '/chat/2', '/chat/3', '/chat/1/members', '/chat/1/invite',
  '/calendar', '/contacts', '/calls', '/profile', '/settings', '/settings/appearance',
  '/stars', '/gifts', '/premium', '/stickers', '/saved', '/profile/edit', '/u/2', '/join/aB3xK9pQ']
;(window as any).__ROUTES = ROUTES
audit.autoSweep(ROUTES)
