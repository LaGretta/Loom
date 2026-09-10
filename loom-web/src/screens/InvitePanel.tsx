import { useCallback, useEffect, useState, lazy, Suspense } from 'react'
import { Copy, Share2, QrCode as QrIcon, Trash2, Plus, Link2 } from 'lucide-react'
import { chatsApi, inviteLink } from '../lib/api'
import { ApiError } from '../lib/http'
import { Button, CenterSpinner, EmptyState, ErrorState, Modal, Segmented, Spinner } from '../ui/primitives'
import { toast } from '../ui/toast'
import type { Invite } from '../lib/types'

const QrCode = lazy(() => import('../ui/QrCode').then((m) => ({ default: m.QrCode })))

type Expiry = 'never' | '1h' | '1d' | '1w'
type Uses = 'unlimited' | '1' | '10' | '100'

const EXPIRY_HOURS: Record<Expiry, number | null> = { never: null, '1h': 1, '1d': 24, '1w': 168 }
const MAX_USES: Record<Uses, number | null> = { unlimited: null, '1': 1, '10': 10, '100': 100 }

const isDenied = (e: unknown) => e instanceof ApiError && (e.status === 401 || e.status === 403)
const errText = (e: unknown, fallback: string) =>
  isDenied(e) ? ((e as ApiError).message || 'You don’t have permission to do that')
    : (e instanceof Error && e.message) || fallback

/** "in 3 days" / "in 5 hours" / "in 12 minutes" — or null when it has already lapsed. */
function untilText(iso: string): string | null {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return null
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `in ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`
  const days = Math.round(hours / 24)
  return `in ${days} ${days === 1 ? 'day' : 'days'}`
}

function usesText(inv: Invite): string {
  if (inv.maxUses == null) return inv.uses === 1 ? '1 use' : `${inv.uses} uses`
  return `${inv.uses} / ${inv.maxUses} used`
}

function expiryText(inv: Invite): string {
  if (inv.expiresAt == null) return 'Never expires'
  const left = untilText(inv.expiresAt)
  return left ? `Expires ${left}` : 'Expired'
}

async function copy(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true }
  } catch { /* fall through to the legacy path */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch { return false }
}

/**
 * Invite-link management for a group or channel. Admin+ only — the caller decides
 * whether to render it at all; every request here is also gated server-side.
 */
export function InvitePanel({ chatId, chatTitle }: { chatId: number; chatTitle: string }) {
  const [invites, setInvites] = useState<Invite[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [creating, setCreating] = useState(false)
  const [expiry, setExpiry] = useState<Expiry>('never')
  const [uses, setUses] = useState<Uses>('unlimited')
  const [qrFor, setQrFor] = useState<Invite | null>(null)
  const [revoking, setRevoking] = useState<Invite | null>(null)
  const [busyCode, setBusyCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setFailed(false)
      setInvites(await chatsApi.invites(chatId))
    } catch {
      setInvites(null)
      setFailed(true)
    }
  }, [chatId])

  useEffect(() => { void load() }, [load])

  const create = async () => {
    setCreating(true)
    try {
      const inv = await chatsApi.createInvite(chatId, {
        expiresInHours: EXPIRY_HOURS[expiry],
        maxUses: MAX_USES[uses],
      })
      setInvites((list) => [inv, ...(list ?? [])])
      if (await copy(inviteLink(inv.code))) toast('Invite link created and copied')
      else toast('Invite link created')
    } catch (e) {
      toast(errText(e, 'Could not create an invite'))
      if (isDenied(e)) void load()
    } finally { setCreating(false) }
  }

  const revoke = async (inv: Invite) => {
    setRevoking(null)
    setBusyCode(inv.code)
    try {
      await chatsApi.revokeInvite(inv.code)
      setInvites((list) => list?.filter((i) => i.code !== inv.code) ?? list)
      toast('Invite revoked')
    } catch (e) {
      toast(errText(e, 'Could not revoke that invite'))
      void load()
    } finally { setBusyCode(null) }
  }

  const share = async (inv: Invite) => {
    const url = inviteLink(inv.code)
    // Native share sheet where the platform has one; clipboard everywhere else.
    if (navigator.share) {
      try {
        await navigator.share({ title: chatTitle, text: `Join “${chatTitle}” on Loom`, url })
        return
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return   // user closed the sheet
      }
    }
    toast(await copy(url) ? 'Link copied' : 'Could not copy the link')
  }

  return (
    <>
      <div className="invite-create">
        <div className="inv-opt">
          <span className="field-label" style={{ margin: 0 }}>Expires</span>
          <Segmented<Expiry>
            value={expiry}
            onChange={setExpiry}
            options={[
              { value: 'never', label: 'Never' },
              { value: '1h', label: '1 hour' },
              { value: '1d', label: '1 day' },
              { value: '1w', label: '1 week' },
            ]}
          />
        </div>
        <div className="inv-opt">
          <span className="field-label" style={{ margin: 0 }}>Max uses</span>
          <Segmented<Uses>
            value={uses}
            onChange={setUses}
            options={[
              { value: 'unlimited', label: '∞' },
              { value: '1', label: '1' },
              { value: '10', label: '10' },
              { value: '100', label: '100' },
            ]}
          />
        </div>
        <Button block onClick={() => void create()} disabled={creating}>
          {creating ? <Spinner /> : <><Plus size={17} /> Create invite link</>}
        </Button>
      </div>

      {failed ? (
        <ErrorState subtitle="Couldn’t load the invite links." onRetry={() => void load()} />
      ) : !invites ? <CenterSpinner /> : invites.length === 0 ? (
        <EmptyState
          icon={<Link2 size={34} strokeWidth={1.4} />}
          title="No invite links yet"
          subtitle="Create one above and share it — anyone with the link can join."
        />
      ) : (
        <div className="list-card">
          {invites.map((inv) => (
            <div key={inv.code} className="list-row invite-row">
              <span className="grow" style={{ minWidth: 0 }}>
                <span className="inv-link ellipsis">{inviteLink(inv.code)}</span>
                <span className="lr-sub" style={{ display: 'block' }}>
                  {usesText(inv)} · {expiryText(inv)}
                </span>
              </span>

              <span className={`inv-badge ${inv.isActive ? 'on' : ''}`}>
                {inv.isActive ? 'Active' : 'Expired'}
              </span>

              {busyCode === inv.code ? <Spinner /> : (
                <span className="inv-actions">
                  <button className="icon-btn" style={{ width: 32, height: 32 }} title="Copy link"
                    aria-label={`Copy invite link ${inv.code}`}
                    onClick={() => void copy(inviteLink(inv.code)).then((ok) => toast(ok ? 'Link copied' : 'Could not copy the link'))}>
                    <Copy size={17} />
                  </button>
                  <button className="icon-btn" style={{ width: 32, height: 32 }} title="Show QR code"
                    aria-label={`Show QR code for invite ${inv.code}`} onClick={() => setQrFor(inv)}>
                    <QrIcon size={17} />
                  </button>
                  <button className="icon-btn" style={{ width: 32, height: 32 }} title="Share"
                    aria-label={`Share invite ${inv.code}`} onClick={() => void share(inv)}>
                    <Share2 size={17} />
                  </button>
                  <button className="icon-btn danger-ic" style={{ width: 32, height: 32 }} title="Revoke"
                    aria-label={`Revoke invite ${inv.code}`} onClick={() => setRevoking(inv)}>
                    <Trash2 size={17} />
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {qrFor && (
        <Modal title="Scan to join" onClose={() => setQrFor(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setQrFor(null)}>Close</Button>
            <Button onClick={() => void copy(inviteLink(qrFor.code)).then((ok) => toast(ok ? 'Link copied' : 'Could not copy the link'))}>
              <Copy size={16} /> Copy link
            </Button>
          </>}>
          <div className="qr-wrap">
            <Suspense fallback={<CenterSpinner />}>
              <QrCode text={inviteLink(qrFor.code)} size={216} />
            </Suspense>
          </div>
          <div className="inv-link qr-code-text">{inviteLink(qrFor.code)}</div>
        </Modal>
      )}

      {revoking && (
        <Modal title="Revoke invite?" onClose={() => setRevoking(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setRevoking(null)}>Cancel</Button>
            <Button variant="danger" className="fill" onClick={() => void revoke(revoking)}>Revoke</Button>
          </>}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>
            This link stops working immediately. Anyone who already joined with it stays in the chat.
          </p>
        </Modal>
      )}
    </>
  )
}
