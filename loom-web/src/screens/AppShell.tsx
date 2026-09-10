import { useEffect, useRef } from 'react'
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { MessageCircle, Calendar, Users, Phone, User } from 'lucide-react'
import { useChat } from '../store/chat'
import { useNav } from '../store/nav'
import { ChatsPage } from './ChatsPage'
import { CalendarPage } from './CalendarPage'
import { ContactsPage } from './ContactsPage'
import { CallsPage } from './CallsPage'
import { ProfileHub } from './ProfileHub'
import { SettingsScreen } from './SettingsScreen'
import { AppearanceScreen } from './AppearanceScreen'
import { StarsScreen } from './StarsScreen'
import { GiftsScreen } from './GiftsScreen'
import { PremiumScreen } from './PremiumScreen'
import { StickersScreen } from './StickersScreen'
import { UserProfileScreen } from './UserProfileScreen'
import { EditProfileScreen } from './EditProfileScreen'
import { MembersScreen } from './MembersScreen'
import { InviteScreen } from './InviteScreen'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { SavedScreen } from './SavedScreen'
import { BurgerMenu } from './BurgerMenu'
import { ConnectionStrip } from '../ui/ConnectionStrip'
import { useKeyboardInset } from '../ui/useKeyboardInset'
import { useHotkeys } from '../ui/useHotkeys'
import { useNotifications } from '../ui/useNotifications'

type Tab = 'chats' | 'calendar' | 'contacts' | 'calls' | 'profile'

const LAST_PATH = 'loom.lastPath'
const RESTORABLE = /^\/(chat\/\d+|calendar|contacts|calls|profile)$/

/** Remember where the user was and return there on the next open. */
function useSessionRestore(pathname: string) {
  const navigate = useNavigate()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    if (pathname !== '/') return
    try {
      const last = localStorage.getItem(LAST_PATH)
      if (last && RESTORABLE.test(last)) navigate(last, { replace: true })
    } catch { /* private mode */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (RESTORABLE.test(pathname) || pathname === '/') {
      try { localStorage.setItem(LAST_PATH, pathname) } catch { /* ignore */ }
    }
  }, [pathname])
}

function tabFromPath(p: string): Tab | null {
  if (p === '/' || p.startsWith('/chat')) return 'chats'
  if (p.startsWith('/calendar')) return 'calendar'
  if (p.startsWith('/contacts')) return 'contacts'
  if (p.startsWith('/calls')) return 'calls'
  if (p === '/profile') return 'profile'
  return null
}

export function AppShell() {
  const { pathname } = useLocation()
  const loadChats = useChat((s) => s.loadChats)
  const menuOpen = useNav((s) => s.menuOpen)
  const openMenu = useNav((s) => s.openMenu)
  const closeMenu = useNav((s) => s.closeMenu)

  const derived = tabFromPath(pathname)
  const lastTab = useRef<Tab>('chats')
  if (derived) lastTab.current = derived
  const activeTab = lastTab.current

  useEffect(() => { void loadChats() }, [loadChats])

  // Offline outbox: restore anything queued from a previous session, then drain it
  // whenever the browser reports connectivity again.
  useEffect(() => {
    const st = useChat.getState()
    st.hydrateOutbox()
    void st.flushOutbox()
    const onOnline = () => void useChat.getState().flushOutbox()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])
  useKeyboardInset()
  useHotkeys()
  useNotifications()
  useSessionRestore(pathname)

  return (
    <div className="app-shell">
      {/* Desktop left dock with the burger — hidden on the chat screen, where the burger
          lives inside the chat-list island header (full-bleed canvas, per design). */}
      {activeTab !== 'chats' && (
        <div className="nav-dock desktop-only">
          <button className="burger-btn" title="Menu" aria-label="Open menu" onClick={openMenu}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="pane" style={{ flex: 1, minWidth: 0 }}>
        <TabContent tab={activeTab} pathname={pathname} />
      </div>

      {/* Realtime connection status */}
      <ConnectionStrip />

      {/* Mobile bottom nav */}
      <MobileNav activeTab={derived} />

      {/* Burger menu popover */}
      {menuOpen && <BurgerMenu onClose={closeMenu} activeTab={activeTab} />}
    </div>
  )
}

// Renders the base tab pane. Overlays are routed on top of it.
function TabContent({ tab, pathname }: { tab: Tab; pathname: string }) {
  const navigate = useNavigate()
  // Base pane persists behind overlays
  const base =
    tab === 'chats' ? <ChatsPage />
      : tab === 'calendar' ? <CalendarPage />
        : tab === 'contacts' ? <ContactsPage />
          : tab === 'calls' ? <CallsPage />
            : <ProfileHub />

  return (
    <>
      {/* keyed so the fade replays on every pane switch (design §7) */}
      {/* minHeight:0 — without it this flex child keeps its content height, the pane below
          never becomes scrollable, and the tail of every tab screen is clipped away. */}
      <div key={tab} className="anim-fade" style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <ErrorBoundary key={tab}>{base}</ErrorBoundary>
      </div>
      {/* Overlay routes render above the base pane. Each is boundaried on its own so a
          broken overlay never blanks the conversation behind it. */}
      <ErrorBoundary key={`ov:${pathname}`} onReset={() => navigate('/', { replace: true })}>
      <Routes>
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/settings/appearance" element={<AppearanceScreen />} />
        <Route path="/stars" element={<StarsScreen />} />
        <Route path="/gifts" element={<GiftsScreen />} />
        <Route path="/premium" element={<PremiumScreen />} />
        <Route path="/stickers" element={<StickersScreen />} />
        <Route path="/saved" element={<SavedScreen />} />
        <Route path="/profile/edit" element={<EditProfileScreen />} />
        <Route path="/u/:id" element={<UserProfileScreen />} />
        <Route path="/chat/:id/members" element={<MembersScreen />} />
        <Route path="/chat/:id/invite" element={<InviteScreen />} />
        <Route path="*" element={pathname === '/' || tab ? null : <Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </>
  )
}

function MobileNav({ activeTab }: { activeTab: Tab | null }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const totalUnread = useChat((s) => s.chats.reduce((n, c) => n + (c.unreadCount || 0), 0))
  // Hide bottom nav inside an open chat on mobile (full-screen conversation)
  const inChat = /^\/chat\/\d+/.test(pathname)
  if (inChat) return null

  const items: { id: Tab; icon: typeof MessageCircle; to: string; label: string; badge?: number }[] = [
    { id: 'chats', icon: MessageCircle, to: '/', label: 'Chats', badge: totalUnread },
    { id: 'calendar', icon: Calendar, to: '/calendar', label: 'Calendar' },
    { id: 'contacts', icon: Users, to: '/contacts', label: 'Contacts' },
    { id: 'calls', icon: Phone, to: '/calls', label: 'Calls' },
    { id: 'profile', icon: User, to: '/profile', label: 'Profile' },
  ]
  return (
    <nav className="bottom-nav mobile-only">
      {items.map((t) => {
        const Icon = t.icon
        return (
          <button key={t.id} className={`nav-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => navigate(t.to)} style={{ position: 'relative' }}>
            <Icon size={22} strokeWidth={activeTab === t.id ? 2.4 : 1.9} />
            <span className="nl">{t.label}</span>
            {!!t.badge && t.badge > 0 && (
              <span className="badge" style={{ position: 'absolute', top: -2, right: 4, minWidth: 16, height: 16, fontSize: 10 }}>{t.badge}</span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
