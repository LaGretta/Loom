import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './store/auth'
import { wireRealtime } from './store/chat'
import { CenterSpinner } from './ui/primitives'
import { ToastHost } from './ui/toast'
import { AuthScreen } from './screens/AuthScreen'
import { AppShell } from './screens/AppShell'

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
        <Route path="/login" element={authed ? <Navigate to="/" replace /> : <AuthScreen />} />
        <Route
          path="/*"
          element={authed ? <AppShell /> : <Navigate to="/login" replace state={{ from: location.pathname }} />}
        />
      </Routes>
      <ToastHost />
    </>
  )
}
