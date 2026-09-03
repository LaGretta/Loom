import { useRef, useState, useEffect } from 'react'
import { Paperclip, ArrowUp, Mic, X, Reply, Forward, Copy, Pin, Trash2, Pencil } from 'lucide-react'
import { Sheet } from '../ui/primitives'
import { CraftedObject } from '../ui/CraftedObject'
import { useChat } from '../store/chat'
import { mediaApi, messagesApi } from '../lib/api'
import { toast } from '../ui/toast'
import { LOOMI_POSES, STAR_POSES } from '../assets/loom'
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
  const [text, setText] = useState('')
  const [attachOpen, setAttachOpen] = useState(false)
  const [stickerOpen, setStickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastTyping = useRef(0)
  const send = useChat((s) => s.send)
  const edit = useChat((s) => s.edit)
  const ingest = useChat((s) => s.ingestMessage)
  const sendTyping = useChat((s) => s.sendTyping)

  useEffect(() => {
    if (editing) { setText(editing.content); taRef.current?.focus() }
  }, [editing])

  const grow = () => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  const onInput = (v: string) => {
    setText(v)
    grow()
    const now = Date.now()
    if (now - lastTyping.current > 1500) { lastTyping.current = now; sendTyping(chatId) }
  }

  const submit = async () => {
    const content = text.trim()
    if (!content || busy) return
    setBusy(true)
    try {
      if (editing) { await edit(editing.id, chatId, content); onCancelEdit?.() }
      else { await send(chatId, content, replyTo?.id ?? null); onCancelReply?.() }
      setText('')
      requestAnimationFrame(grow)
    } catch { toast('Could not send message') }
    finally { setBusy(false) }
  }

  const onFile = async (file: File) => {
    setAttachOpen(false)
    setBusy(true)
    try {
      const { url } = await mediaApi.upload(file)
      const isImg = file.type.startsWith('image/')
      // Backend Message.content carries the URL; type flags media. // TODO(backend): attachment metadata endpoint
      const msg = await messagesApi.send({ chatId, content: url, type: isImg ? 'Image' : 'File' })
      ingest(msg)
      toast('Sent')
    } catch { toast('Upload failed') }
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
      {(replyTo || editing) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 0' }}>
          <div style={{ width: 3, alignSelf: 'stretch', background: 'var(--accent)', borderRadius: 3 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{editing ? 'Editing' : `Reply to ${replyTo?.senderName}`}</div>
            <div className="ellipsis muted" style={{ fontSize: 12.5 }}>{(editing ?? replyTo)?.content}</div>
          </div>
          <button className="icon-btn" onClick={() => { onCancelReply?.(); onCancelEdit?.() }}><X size={18} /></button>
        </div>
      )}
      <div className="composer">
        <button className="icon-btn" onClick={() => setAttachOpen(true)} title="Attach"><Paperclip size={22} /></button>
        <div className="field">
          <textarea
            ref={taRef}
            rows={1}
            placeholder="Message"
            value={text}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit() } }}
          />
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setStickerOpen(true)} title="Stickers">
            <CraftedObject id="loomi-wave" kind="sticker" size={26} />
          </button>
        </div>
        {text.trim()
          ? <button className="send-btn" onClick={() => void submit()} disabled={busy} aria-label="Send"><ArrowUp size={22} /></button>
          : <button className="send-btn" onClick={() => toast('Voice recording — coming soon')} aria-label="Record"><Mic size={20} /></button>}
      </div>

      <input ref={fileRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.currentTarget.value = '' }} />

      {attachOpen && (
        <Sheet onClose={() => setAttachOpen(false)}>
          <div style={{ fontSize: 15, fontWeight: 800, padding: '2px 6px 6px' }}>Attach</div>
          <div className="obj-grid">
            {ATTACH_ITEMS.map((it) => (
              <button key={it.label} className="obj-cell" onClick={() => {
                if (it.label === 'Photos' || it.label === 'File' || it.label === 'Camera') fileRef.current?.click()
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

export function MessageContextMenu({ message, mine, onClose, onReply, onEdit }: {
  message: Message
  mine: boolean
  onClose: () => void
  onReply: () => void
  onEdit: () => void
}) {
  const react = useChat((s) => s.react)
  const remove = useChat((s) => s.remove)

  return (
    <div className="ctx-wrap anim-scrim" onMouseDown={onClose}>
      <div className="quick-react anim-menu" onMouseDown={(e) => e.stopPropagation()}>
        {QUICK_REACTIONS.map((e) => (
          <button key={e} onClick={() => { void react(message.id, message.chatId, e); onClose() }}>{e}</button>
        ))}
      </div>
      <div className="ctx-card anim-menu" onMouseDown={(e) => e.stopPropagation()}>
        <button className="ctx-item" onClick={() => { onReply(); onClose() }}><Reply size={18} /> Reply</button>
        <button className="ctx-item" onClick={() => { navigator.clipboard?.writeText(message.content); toast('Copied'); onClose() }}><Copy size={18} /> Copy</button>
        <button className="ctx-item" onClick={() => { toast('Forward — coming soon'); onClose() }}><Forward size={18} /> Forward</button>
        <button className="ctx-item" onClick={() => { toast('Pinned'); onClose() }}><Pin size={18} /> Pin</button>
        {mine && <button className="ctx-item" onClick={() => { onEdit(); onClose() }}><Pencil size={18} /> Edit</button>}
        {mine && <button className="ctx-item danger" onClick={() => { void remove(message.id, message.chatId); onClose() }}><Trash2 size={18} /> Delete</button>}
      </div>
    </div>
  )
}
