import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera, Pencil, ShieldCheck, ShieldOff, UserMinus, MessageSquare,
  LogOut, Trash2, MoreVertical, Crown, UserPlus,
} from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { AnchoredMenu } from '../ui/AnchoredMenu'
import { Button, CenterSpinner, ErrorState, Modal, Spinner, Switch } from '../ui/primitives'
import { chatsApi, mediaApi } from '../lib/api'
import { ApiError } from '../lib/http'
import { useChat } from '../store/chat'
import { useAuth } from '../store/auth'
import { toast } from '../ui/toast'
import { isOnline, type MemberRole } from '../lib/enums'
import { presenceText } from '../ui/format'
import { InvitePanel } from './InvitePanel'
import type { Chat, ChatMember } from '../lib/types'

const ChatMediaGallery = lazy(() => import('./ChatMediaGallery').then((m) => ({ default: m.ChatMediaGallery })))

const RANK: Record<MemberRole, number> = { Owner: 0, Admin: 1, Member: 2 }
const isAdminPlus = (r: MemberRole | undefined) => r === 'Owner' || r === 'Admin'

/**
 * A permission denial — 403 since the backend's ForbiddenException landed. 401 is still
 * accepted because ChatService.RemoveMember (kick) has not been migrated yet and answers
 * its three checks with UnauthorizedAccessException → 401.
 */
const isDenied = (e: unknown) => e instanceof ApiError && (e.status === 403 || e.status === 401)
const errText = (e: unknown, fallback: string) =>
  isDenied(e) ? ((e as ApiError).message || 'You don’t have permission to do that')
    : (e instanceof Error && e.message) || fallback

/**
 * Group / channel management. Everything here is gated on MY role as the server reports
 * it (ChatResponseDto.myRole), and mirrors the server's own rules — an action the user
 * cannot perform is never rendered. Roles can still change while the screen is open, so
 * every call also handles a denial by explaining it and re-reading the real state.
 */
export function GroupInfoScreen({ chat }: { chat: Chat }) {
  const chatId = chat.id
  const navigate = useNavigate()
  const me = useAuth((s) => s.me)
  const presence = useChat((s) => s.presence)
  const toggleMute = useChat((s) => s.toggleMute)
  const refreshChat = useChat((s) => s.refreshChat)
  const updateChat = useChat((s) => s.updateChat)
  const leaveChat = useChat((s) => s.leaveChat)
  const deleteChat = useChat((s) => s.deleteChat)
  const bumpMembers = useChat((s) => s.bumpMembers)

  const [members, setMembers] = useState<ChatMember[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [menuFor, setMenuFor] = useState<{ m: ChatMember; x: number; y: number } | null>(null)
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState<'leave' | 'delete' | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busyUser, setBusyUser] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const myRole = chat.myRole ?? 'Member'
  const canEdit = isAdminPlus(myRole)
  const isOwner = myRole === 'Owner'
  const kind = chat.type === 'Channel' ? 'channel' : 'group'

  const loadMembers = useCallback(async () => {
    try {
      setLoadError(false)
      setMembers(await chatsApi.members(chatId, { fresh: true }))
    } catch {
      setMembers(null)
      setLoadError(true)
    }
  }, [chatId])

  useEffect(() => { void loadMembers() }, [loadMembers])

  /** After anything that can change permissions, re-read both sides of the truth. */
  const resync = useCallback(async () => {
    await Promise.all([refreshChat(chatId), loadMembers()])
  }, [chatId, refreshChat, loadMembers])

  const sorted = useMemo(() => {
    if (!members) return null
    return [...members].sort((a, b) =>
      RANK[a.role] - RANK[b.role] || a.displayName.localeCompare(b.displayName))
  }, [members])

  /* ---------------- actions ---------------- */

  const onAvatarFile = async (file: File) => {
    setUploading(true)
    try {
      const { url } = await mediaApi.upload(file)
      await updateChat(chatId, { avatarUrl: url })
      toast('Photo updated')
    } catch (e) {
      toast(errText(e, 'Could not update the photo'))
      if (isDenied(e)) void resync()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const setRole = async (m: ChatMember, role: MemberRole) => {
    setBusyUser(m.userId)
    // optimistic: the badge and the available actions flip at once
    setMembers((list) => list?.map((x) => (x.userId === m.userId ? { ...x, role } : x)) ?? list)
    try {
      await chatsApi.setRole(chatId, m.userId, role)
      toast(role === 'Admin' ? `${m.displayName} is an admin` : `${m.displayName} is no longer an admin`)
      await loadMembers()
    } catch (e) {
      toast(errText(e, 'Could not change the role'))
      await resync()
    } finally { setBusyUser(null) }
  }

  const kick = async (m: ChatMember) => {
    setBusyUser(m.userId)
    try {
      await chatsApi.removeMember(chatId, m.userId)
      bumpMembers(chatId, -1)
      toast(`${m.displayName} removed`)
      await loadMembers()
    } catch (e) {
      toast(errText(e, 'Could not remove that member'))
      await resync()
    } finally { setBusyUser(null) }
  }

  const message = async (m: ChatMember) => {
    try {
      const direct = await chatsApi.create({ type: 'Direct', memberUserIds: [m.userId] })
      navigate(`/chat/${direct.id}`)
    } catch (e) { toast(errText(e, 'Could not open the chat')) }
  }

  const doLeave = async () => {
    try {
      await leaveChat(chatId)
      setConfirm(null)
      navigate('/', { replace: true })
    } catch (e) { toast(errText(e, `Could not leave the ${kind}`)); void resync() }
  }

  const doDelete = async () => {
    try {
      await deleteChat(chatId)
      setConfirm(null)
      navigate('/', { replace: true })
      toast(`${chat.title || 'Chat'} deleted`)
    } catch (e) { toast(errText(e, `Could not delete the ${kind}`)); void resync() }
  }

  /* ---------------- per-member permissions (mirrors the server) ---------------- */

  const canPromote = (m: ChatMember) => isOwner && m.userId !== me?.id && m.role === 'Member'
  const canDemote = (m: ChatMember) => isOwner && m.userId !== me?.id && m.role === 'Admin'
  const canKick = (m: ChatMember) =>
    canEdit && m.userId !== me?.id && m.role !== 'Owner' && !(m.role === 'Admin' && !isOwner)

  const title = chat.title || (chat.type === 'Channel' ? 'Channel' : 'Group')
  const memberCount = sorted?.length ?? chat.membersCount

  return (
    <>
      {/* ---------------- header ---------------- */}
      <div className="grp-head">
        <div className="grp-ava">
          <Avatar name={title} id={chatId} src={chat.avatarUrl} size={96} />
          {canEdit && (
            <button
              className="grp-ava-btn"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change photo"
              title="Change photo"
            >
              {uploading ? <Spinner /> : <Camera size={16} />}
            </button>
          )}
          <input
            ref={fileRef} type="file" accept="image/*" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void onAvatarFile(f) }}
          />
        </div>

        <div className="grp-title">
          {title}
          {canEdit && (
            <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setEditing(true)}
              aria-label={`Edit ${kind}`} title={`Edit ${kind}`}>
              <Pencil size={16} />
            </button>
          )}
        </div>

        {chat.description && <div className="grp-desc">{chat.description}</div>}

        <div className="grp-sub">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
          {myRole !== 'Member' && <> · you are {myRole === 'Owner' ? 'the owner' : 'an admin'}</>}
        </div>
      </div>

      {/* ---------------- settings ---------------- */}
      <div className="section-label">Chat settings</div>
      <div className="list-card">
        <div className="list-row" style={{ cursor: 'default' }}>
          <span className="grow">
            <span className="lr-title">Mute notifications</span>
            <span className="lr-sub" style={{ display: 'block' }}>
              {chat.isMuted ? 'No sound, no badge, no notifications' : 'You’ll be notified about new messages'}
            </span>
          </span>
          <Switch on={!!chat.isMuted} onChange={() => void toggleMute(chatId)} label="Mute notifications" />
        </div>
      </div>

      {canEdit && (
        <>
          <div className="section-label"><UserPlus size={12} /> Invite people</div>
          <InvitePanel chatId={chatId} chatTitle={title} />
        </>
      )}

      <div className="section-label">Shared</div>
      <Suspense fallback={<CenterSpinner />}><ChatMediaGallery chatId={chatId} /></Suspense>

      {/* ---------------- members ---------------- */}
      <div className="section-label">Members{sorted ? ` · ${sorted.length}` : ''}</div>
      {loadError ? (
        <ErrorState subtitle="Couldn’t load the member list." onRetry={() => void loadMembers()} />
      ) : !sorted ? <CenterSpinner /> : (
        <div className="list-card">
          {sorted.map((m) => {
            const live = presence[m.userId]
            const online = live?.online ?? isOnline(m.status)
            const actionable = canPromote(m) || canDemote(m) || canKick(m) || m.userId !== me?.id
            return (
              <div key={m.userId} className="list-row member-row">
                <button className="member-main" onClick={() => navigate(`/u/${m.userId}`)}>
                  <Avatar name={m.displayName} id={m.userId} src={m.avatarUrl} size={46} online={online} />
                  <span className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                    <span className="lr-title ellipsis" style={{ display: 'block' }}>
                      {m.displayName}{m.userId === me?.id && <span className="muted"> · you</span>}
                    </span>
                    <span className="lr-sub ellipsis" style={{ display: 'block' }}>
                      @{m.userName} · <span className={online ? 'online' : ''}>{presenceText(m.status, m.lastSeenAt, live)}</span>
                    </span>
                  </span>
                </button>

                {m.role !== 'Member' && (
                  <span className={`role-badge ${m.role === 'Owner' ? 'owner' : ''}`}>
                    {m.role === 'Owner' ? <Crown size={12} /> : <ShieldCheck size={12} />}
                    {m.role}
                  </span>
                )}

                {busyUser === m.userId ? <Spinner /> : actionable && (
                  <button
                    className="icon-btn"
                    style={{ width: 32, height: 32 }}
                    aria-label={`Actions for ${m.displayName}`}
                    onClick={(e) => {
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      setMenuFor({ m, x: r.left, y: r.bottom + 4 })
                    }}
                  ><MoreVertical size={17} /></button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ---------------- danger zone ---------------- */}
      <div className="section-label">Danger zone</div>
      <div className="list-card">
        <button className="list-row danger-row" onClick={() => setConfirm('leave')}>
          <LogOut size={19} />
          <span className="lr-title grow" style={{ textAlign: 'left' }}>Leave {kind}</span>
        </button>
        {isOwner && (
          <button className="list-row danger-row" onClick={() => setConfirm('delete')}>
            <Trash2 size={19} />
            <span className="lr-title grow" style={{ textAlign: 'left' }}>Delete {kind}</span>
          </button>
        )}
      </div>
      <div style={{ height: 24 }} />

      {/* ---------------- overlays ---------------- */}
      {menuFor && (
        <MemberMenu
          member={menuFor.m}
          kind={kind}
          at={{ x: menuFor.x, y: menuFor.y }}
          isMe={menuFor.m.userId === me?.id}
          canPromote={canPromote(menuFor.m)}
          canDemote={canDemote(menuFor.m)}
          canKick={canKick(menuFor.m)}
          onClose={() => setMenuFor(null)}
          onMessage={() => void message(menuFor.m)}
          onPromote={() => void setRole(menuFor.m, 'Admin')}
          onDemote={() => void setRole(menuFor.m, 'Member')}
          onKick={() => void kick(menuFor.m)}
        />
      )}

      {editing && (
        <EditGroupModal
          chat={chat}
          kind={kind}
          onClose={() => setEditing(false)}
          onSave={async (patch) => {
            try {
              await updateChat(chatId, patch)
              toast('Saved')
              setEditing(false)
            } catch (e) {
              toast(errText(e, 'Could not save'))
              if (isDenied(e)) { setEditing(false); void resync() }
            }
          }}
        />
      )}

      {confirm === 'leave' && (
        <Modal
          title={`Leave ${kind}?`}
          onClose={() => setConfirm(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="danger" className="fill" onClick={() => void doLeave()}>Leave</Button>
          </>}
        >
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>
            You’ll stop receiving messages from <b>{title}</b> and it will disappear from your chat list.
            {isOwner && <> As the owner, the {kind} keeps running without you — ownership transfer isn’t supported yet.</>}
          </p>
        </Modal>
      )}

      {confirm === 'delete' && (
        <DeleteGroupModal chat={chat} kind={kind} onClose={() => setConfirm(null)} onConfirm={() => void doDelete()} />
      )}
    </>
  )
}

/* ---------------- member actions ---------------- */

function MemberMenu({ member, kind, at, isMe, canPromote, canDemote, canKick, onClose, onMessage, onPromote, onDemote, onKick }: {
  member: ChatMember
  kind: string
  at: { x: number; y: number }
  isMe: boolean
  canPromote: boolean
  canDemote: boolean
  canKick: boolean
  onClose: () => void
  onMessage: () => void
  onPromote: () => void
  onDemote: () => void
  onKick: () => void
}) {
  const [confirmKick, setConfirmKick] = useState(false)

  if (confirmKick) {
    return (
      <Modal
        title="Remove member?"
        onClose={onClose}
        footer={<>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" className="fill" onClick={() => { onKick(); onClose() }}>Remove</Button>
        </>}
      >
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>
          <b>{member.displayName}</b> will lose access to this chat. They can be added back later.
        </p>
      </Modal>
    )
  }

  return (
    <AnchoredMenu at={at} label={`${member.displayName} actions`} onClose={onClose}>
      {!isMe && (
        <button className="ctx-item" role="menuitem" onClick={() => { onMessage(); onClose() }}>
          <MessageSquare size={18} /> Message
        </button>
      )}
      {canPromote && (
        <button className="ctx-item" role="menuitem" onClick={() => { onPromote(); onClose() }}>
          <ShieldCheck size={18} /> Make admin
        </button>
      )}
      {canDemote && (
        <button className="ctx-item" role="menuitem" onClick={() => { onDemote(); onClose() }}>
          <ShieldOff size={18} /> Remove admin
        </button>
      )}
      {canKick && (
        <button className="ctx-item danger" role="menuitem" onClick={() => setConfirmKick(true)}>
          <UserMinus size={18} /> Remove from {kind}
        </button>
      )}
    </AnchoredMenu>
  )
}

/* ---------------- edit ---------------- */

function EditGroupModal({ chat, kind, onClose, onSave }: {
  chat: Chat
  kind: string
  onClose: () => void
  onSave: (patch: { title?: string; description?: string }) => Promise<void>
}) {
  const [title, setTitle] = useState(chat.title ?? '')
  const [desc, setDesc] = useState(chat.description ?? '')
  const [saving, setSaving] = useState(false)

  const trimmed = title.trim()
  const titleChanged = trimmed.length > 0 && trimmed !== (chat.title ?? '')
  const descChanged = desc.trim() !== (chat.description ?? '').trim()
  const dirty = titleChanged || descChanged

  const submit = async () => {
    if (!dirty || saving) return
    setSaving(true)
    const patch: { title?: string; description?: string } = {}
    if (titleChanged) patch.title = trimmed
    if (descChanged) patch.description = desc.trim()   // "" clears it
    await onSave(patch)
    setSaving(false)
  }

  return (
    <Modal
      title={`Edit ${kind}`}
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => void submit()} disabled={!dirty || saving}>{saving ? <Spinner /> : 'Save'}</Button>
      </>}
    >
      <label className="field-label" htmlFor="grp-title">Name</label>
      <input
        id="grp-title" className="input" value={title} maxLength={120} autoFocus
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
        placeholder={`${kind[0].toUpperCase()}${kind.slice(1)} name`}
      />
      <label className="field-label" htmlFor="grp-desc" style={{ marginTop: 14 }}>Description</label>
      <textarea
        id="grp-desc" className="input" rows={3} value={desc} maxLength={500}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="What is this chat about?"
      />
    </Modal>
  )
}

/* ---------------- delete ---------------- */

function DeleteGroupModal({ chat, kind, onClose, onConfirm }: {
  chat: Chat; kind: string; onClose: () => void; onConfirm: () => void
}) {
  const expected = (chat.title || '').trim() || 'DELETE'
  const [typed, setTyped] = useState('')
  const ok = typed.trim() === expected

  return (
    <Modal
      title={`Delete ${kind}?`}
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" className="fill" onClick={onConfirm} disabled={!ok}>Delete forever</Button>
      </>}
    >
      <p style={{ margin: '0 0 14px', fontSize: 14.5, lineHeight: 1.5 }}>
        This removes the {kind} for <b>everyone</b>, along with its whole message history.
        It cannot be undone.
      </p>
      {/* not .field-label: that uppercases, and the name has to be typed case-exactly */}
      <label className="confirm-ask" htmlFor="grp-del">Type <b>{expected}</b> to confirm</label>
      <input
        id="grp-del" className="input" value={typed} autoFocus autoComplete="off"
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && ok) onConfirm() }}
        placeholder={expected}
        aria-describedby="grp-del-hint"
      />
      <div className="field-hint" id="grp-del-hint">
        {ok ? 'Names match.' : 'The name must match exactly.'}
      </div>
    </Modal>
  )
}
