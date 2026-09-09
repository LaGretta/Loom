import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Link2Off } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { Button, CenterSpinner, Spinner } from '../ui/primitives'
import { chatsApi } from '../lib/api'
import { ApiError } from '../lib/http'
import { useAuth } from '../store/auth'
import { useChat } from '../store/chat'
import { toast } from '../ui/toast'
import { clearPendingInvite, setPendingInvite } from '../lib/pendingInvite'
import type { InvitePreview } from '../lib/types'

/**
 * The landing page for an invite link: /join/{code}. Reachable while signed out —
 * in that case we remember the code and send the visitor through auth first, so the
 * link survives login or registration.
 */
export function JoinScreen() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const authed = useAuth((s) => s.authed)
  const ready = useAuth((s) => s.ready)
  const loadChats = useChat((s) => s.loadChats)

  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'invalid' | 'error'>('loading')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!ready || !authed || !code) return
    let alive = true
    setState('loading')
    chatsApi.invitePreview(code)
      .then((p) => { if (!alive) return; setPreview(p); setState('ok'); clearPendingInvite() })
      .catch((e) => {
        if (!alive) return
        // 404 is the API's answer for invalid / expired / revoked — not a failure to show raw.
        setState(e instanceof ApiError && e.status === 404 ? 'invalid' : 'error')
      })
    return () => { alive = false }
  }, [code, authed, ready])

  if (!ready) return <CenterSpinner />

  if (!authed) {
    // Idempotent write; safe to do here so it lands before <Navigate> unmounts this screen.
    setPendingInvite(code)
    return <Navigate to="/login" replace state={{ from: `/join/${code}` }} />
  }

  const join = async () => {
    if (!preview) return
    setJoining(true)
    try {
      const chat = await chatsApi.joinByInvite(code)
      clearPendingInvite()
      void loadChats()
      navigate(`/chat/${chat.id}`, { replace: true })
    } catch (e) {
      setJoining(false)
      if (e instanceof ApiError && e.status === 404) { setState('invalid'); return }
      toast((e instanceof Error && e.message) || 'Could not join')
    }
  }

  return (
    <div className="join-page">
      <div className="join-card">
        {state === 'loading' && <div style={{ padding: '40px 0' }}><CenterSpinner /></div>}

        {state === 'error' && (
          <>
            <div className="join-icon"><Link2Off size={34} strokeWidth={1.5} /></div>
            <h1 className="join-title">Couldn’t open this invite</h1>
            <p className="join-sub">We couldn’t reach the server. Check your connection and try again.</p>
            <Button block onClick={() => window.location.reload()}>Try again</Button>
            <Button variant="ghost" block onClick={() => navigate('/', { replace: true })}>Go to Loom</Button>
          </>
        )}

        {state === 'invalid' && (
          <>
            <div className="join-icon"><Link2Off size={34} strokeWidth={1.5} /></div>
            <h1 className="join-title">This invite has expired</h1>
            <p className="join-sub">
              The link may have been revoked, run out of uses, or simply timed out.
              Ask whoever sent it for a fresh one.
            </p>
            <Button block onClick={() => navigate('/', { replace: true })}>Go to Loom</Button>
          </>
        )}

        {state === 'ok' && preview && (
          <>
            <Avatar name={preview.title || 'Chat'} id={preview.chatId} src={preview.avatarUrl} size={92} />
            <h1 className="join-title">{preview.title || 'Untitled chat'}</h1>
            {preview.description && <p className="join-desc">{preview.description}</p>}
            <p className="join-sub">
              {preview.membersCount} {preview.membersCount === 1 ? 'member' : 'members'}
              {preview.alreadyMember && ' · you’re already in'}
            </p>

            {preview.alreadyMember ? (
              <Button block onClick={() => navigate(`/chat/${preview.chatId}`, { replace: true })}>
                Open chat
              </Button>
            ) : (
              <Button block onClick={() => void join()} disabled={joining}>
                {joining ? <Spinner /> : 'Join group'}
              </Button>
            )}
            <Button variant="ghost" block onClick={() => navigate('/', { replace: true })}>Not now</Button>
          </>
        )}
      </div>
    </div>
  )
}
