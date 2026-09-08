import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Paperclip, ArrowUp, Mic, X, Reply, Forward, Copy, Trash2, Pencil } from 'lucide-react'
import { Sheet } from '../ui/primitives'
import { useDismiss } from '../ui/useDismiss'
import { useFocusTrap } from '../ui/useFocusTrap'
import { CraftedObject } from '../ui/CraftedObject'
import { useChat } from '../store/chat'
import { messagesApi } from '../lib/api'
import { toast } from '../ui/toast'
import { getDraft, setDraft } from '../lib/drafts'
import { LOOMI_POSES, STAR_POSES } from '../assets/loom'
import { EventAttachModal } from '../components/EventAttachModal'
import type { Message } from '../lib/types'

const QUICK_REACTIONS = ['❤️', '👍', '🔥', '😂', '😮']

const ATTACH_ITEMS: { sym: string; label: string }[] = [
  { sym: 's-camera', label: 'Camera' },
  { sym: 's-photos', label: 'Photos' },
  { sym: 's-file', label: 'File' },
  { sym: 's-calendar', label: 'Event' },
  { sym: 's-pin', label: 'Location' },
  { sym: 's-music', label: 'Music' },
  { sym: 's-person', label: 'Contact' },
  { sym: 's-gift', label: 'Gift' },
]

export function Composer({ chatId, replyTo, onCancelReply, editing, onCancelEdit }: {
  chatId: number
  replyTo?: Message | null
  onCancelReply?: () => void
  editing?: Message | null
  onCancelEdit?: () => void
}) {
  const [text, setText] = useState(() => getDraft(chatId))
  const [attachOpen, setAttachOpen] = useState(false)
  const [stickerOpen, setStickerOpen] = useState(false)
  const [eventOpen, setEventOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastTyping = useRef(0)
  const send = useChat((s) => s.send)
  const sendMedia = useChat((s) => s.sendMedia)
  const edit = useChat((s) => s.edit)
  const ingest = useChat((s) => s.ingestMessage)
  const sendTyping = useChat((s) => s.sendTyping)

  useEffect(() => {
    if (editing) { setText(editing.content); taRef.current?.focus() }
  }, [editing])

  // Chat switch: load that chat's draft, reset the typing throttle, and focus the
  // composer on desktop only (focusing on mobile would pop the keyboard uninvited).
  useEffect(() => {
    setText(getDraft(chatId))
    lastTyping.current = 0
    requestAnimationFrame(grow)
    if (window.matchMedia?.('(min-width: 901px)').matches) taRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  const grow = () => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  const onInput = (v: string) => {
    setText(v)
    setDraft(chatId, v)
    grow()
    // Throttled hub ping: at most one "Typing" every 1.5s while actually typing, and
    // never for an emptied field. Receivers auto-clear the indicator after a pause.
    if (!v.trim()) return
    const now = Date.now()
    if (now - lastTyping.current > 1500) { lastTyping.current = now; sendTyping(chatId) }
  }

  // Fire-and-forget: the bubble is already in the thread optimistically, so the composer
  // clears on the same frame. Failures surface on the bubble itself (Retry), not here.
  const submit = () => {
    const content = text.trim()
    if (!content) return
    setText('')
    setDraft(chatId, '')
    lastTyping.current = 0
    requestAnimationFrame(grow)
    if (editing) {
      const target = editing
      onCancelEdit?.()
      void edit(target.id, chatId, content)
    } else {
      const replyId = replyTo?.id ?? null
      onCancelReply?.()
      void send(chatId, content, replyId)
    }
  }

  const onFile = async (file: File) => {
    setAttachOpen(false)
    setBusy(true)
    // sendMedia shows the photo instantly (local blob) then reconciles with the real message.
    // Backend Message.content carries the URL; type flags media. // TODO(backend): attachment metadata endpoint
    try { await sendMedia(chatId, file) }
    catch { toast('Upload failed') }
    finally { setBusy(false) }
  }

  const sendSticker = async (id: string) => {
    setStickerOpen(false)
    setBusy(true)
    try {
      const msg = await messagesApi.send({ chatId, content: id, type: 'Sticker' })
      ingest(msg)
    } catch { toast('Could not send sticker') }
    finally { setBusy(false) }
  }

  return (
    <>
      <div className="composer-dock">
        {(replyTo || editing) && (
          <div className="composer-reply" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, alignSelf: 'stretch', background: 'var(--accent)', borderRadius: 3 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{editing ? 'Editing' : `Reply to ${replyTo?.senderName}`}</div>
              <div className="ellipsis muted" style={{ fontSize: 12.5 }}>{(editing ?? replyTo)?.content}</div>
            </div>
            <button className="icon-btn" onClick={() => { onCancelReply?.(); onCancelEdit?.() }} aria-label="Cancel"><X size={18} /></button>
          </div>
        )}
        <div className="composer">
          {/* one pill: attach + input + sticker (no divider); send is a separate circle */}
          <div className="field">
            <button className="icon-btn attach-in" onClick={() => setAttachOpen(true)} title="Attach" aria-label="Attach a file"><Paperclip size={21} /></button>
            <textarea
              ref={taRef}
              data-composer
              aria-label="Message"
              rows={1}
              placeholder="Message"
              value={text}
              onChange={(e) => onInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            />
            <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setStickerOpen(true)} title="Stickers" aria-label="Stickers">
              <CraftedObject id="loomi-wave" kind="sticker" size={26} />
            </button>
          </div>
          {text.trim()
            ? <button className="send-btn" onClick={submit} aria-label="Send"><ArrowUp size={22} /></button>
            : <button className="send-btn" onClick={() => toast('Voice recording — coming soon')} aria-label="Record"><Mic size={20} /></button>}
        </div>
      </div>

      <input ref={fileRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.currentTarget.value = '' }} />

      {attachOpen && (
        <Sheet onClose={() => setAttachOpen(false)}>
          <div style={{ fontSize: 15, fontWeight: 800, padding: '2px 6px 6px' }}>Attach</div>
          <div className="obj-grid">
            {ATTACH_ITEMS.map((it) => (
              <button key={it.label} className="obj-cell" onClick={() => {
                if (it.label === 'Photos' || it.label === 'File' || it.label === 'Camera') fileRef.current?.click()
                else if (it.label === 'Event') { setAttachOpen(false); setEventOpen(true) }
                else { setAttachOpen(false); toast(`${it.label} — coming soon`) }
              }}>
                <CraftedObject id={it.sym} size={54} />
                <span className="lbl">{it.label}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {stickerOpen && (
        <Sheet onClose={() => setStickerOpen(false)}>
          <StickerPickerBody onPick={(id) => void sendSticker(id)} />
        </Sheet>
      )}

      {eventOpen && (
        <EventAttachModal chatId={chatId} onClose={() => setEventOpen(false)} />
      )}
    </>
  )
}

export function StickerPickerBody({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div>
      {[{ name: 'Loomi', poses: LOOMI_POSES }, { name: 'Star Buddy', poses: STAR_POSES }].map((pack) => (
        <div key={pack.name}>
          <div className="section-label" style={{ padding: '10px 6px 6px' }}>{pack.name}</div>
          <div className="sticker-grid">
            {pack.poses.map((p) => (
              <button key={p} className="sticker-cell" onClick={() => onPick(p)}>
                <CraftedObject id={p} kind="sticker" size={64} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function MessageContextMenu({ message, mine, at, onClose, onReply, onEdit }: {
  message: Message
  mine: boolean
  at: { x: number; y: number }        // tap/click point the menu is anchored to
  onClose: () => void
  onReply: () => void
  onEdit: () => void
}) {
  const react = useChat((s) => s.react)
  const remove = useChat((s) => s.remove)
  const { closing, dismiss } = useDismiss(onClose)
  const boxRef = useRef<HTMLDivElement>(null)
  useFocusTrap(boxRef, !closing)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  // Anchor at the point, then flip/clamp so the menu never leaves the viewport.
  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const M = 10
    let left = at.x
    let top = at.y
    if (left + width + M > window.innerWidth) left = at.x - width      // flip to the left
    if (left < M) left = M
    if (left + width + M > window.innerWidth) left = Math.max(M, window.innerWidth - width - M)
    if (top + height + M > window.innerHeight) top = at.y - height     // flip above
    if (top < M) top = M
    setPos({ left, top })
  }, [at.x, at.y])

  // Esc, and any scroll underneath, dismiss the menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); dismiss() } }
    const onScroll = () => dismiss()
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)   // capture: also catches the thread's scroller
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [dismiss])

  const act = (fn: () => void) => { fn(); dismiss() }
  const canCopy = !message.isDeleted && message.type === 'Text'

  return (
    <div className={`ctx-wrap ${closing ? 'out-scrim' : ''}`}
      onMouseDown={dismiss}
      onContextMenu={(e) => { e.preventDefault(); dismiss() }}>
      <div
        ref={boxRef}
        role="menu"
        aria-label="Message actions"
        className={`ctx-anchor anim-menu ${closing ? 'out-menu' : ''}`}
        style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, visibility: 'hidden' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="quick-react" role="group" aria-label="Quick reactions">
          {QUICK_REACTIONS.map((e) => (
            <button key={e} aria-label={`React ${e}`} onClick={() => act(() => void react(message.id, message.chatId, e))}>{e}</button>
          ))}
        </div>

        <div className="ctx-card">
          <button className="ctx-item" role="menuitem" onClick={() => act(onReply)}><Reply size={18} /> Reply</button>
          {canCopy && (
            <button className="ctx-item" role="menuitem"
              onClick={() => act(() => { navigator.clipboard?.writeText(message.content); toast('Copied') })}>
              <Copy size={18} /> Copy text
            </button>
          )}
          <button className="ctx-item" role="menuitem" disabled aria-disabled="true" title="Forwarding isn’t available yet">
            <Forward size={18} /> Forward <span className="ctx-soon">Soon</span>
          </button>
          {mine && !message.isDeleted && (
            <button className="ctx-item" role="menuitem" onClick={() => act(onEdit)}><Pencil size={18} /> Edit</button>
          )}
          {mine && !message.isDeleted && (
            <button className="ctx-item danger" role="menuitem"
              onClick={() => act(() => void remove(message.id, message.chatId))}>
              <Trash2 size={18} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
