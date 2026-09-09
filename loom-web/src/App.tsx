import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './store/auth'
import { wireRealtime } from './store/chat'
import { CenterSpinner } from './ui/primitives'
import { ToastHost } from './ui/toast'
import { AuthScreen } from './screens/AuthScreen'
import { AppShell } from './screens/AppShell'
import { JoinScreen } from './screens/JoinScreen'
import { peekPendingInvite } from './lib/pendingInvite'

/** Where to land once signed in: back to whatever was interrupted, or a pending invite. */
function afterAuth(state: unknown): string {
  const from = (state as { from?: string } | null)?.from
  if (from && from !== '/login') return from
  const pending = peekPendingInvite()
  return pending ? `/join/${pending}` : '/'
}

export default function App() {
  const ready = useAuth((s) => s.ready)
  const authed = useAuth((s) => s.authed)
  const bootstrap = useAuth((s) => s.bootstrap)
  const location = useLocation()

  useEffect(() => { wireRealtime(); void bootstrap() }, [bootstrap])

  if (!ready) return <CenterSpinner />

  return (
    <>
      <Routes>
        {/* Public: an invite link has to open for signed-out visitors too — the screen
            itself stores the code and bounces them through auth. */}
        <Route path="/join/:code" element={<JoinScreen />} />
        <Route path="/login" element={authed ? <Navigate to={afterAuth(location.state)} replace /> : <AuthScreen />} />
        <Route
          path="/*"
          element={authed ? <AppShell /> : <Navigate to="/login" replace state={{ from: location.pathname }} />}
        />
      </Routes>
      <ToastHost />
    </>
  )
}
