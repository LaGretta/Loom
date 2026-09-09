import { useEffect, useState } from 'react'
import { Pin, X } from 'lucide-react'
import { useChat } from '../store/chat'
import type { Message } from '../lib/types'

/** Short label for a pinned message — media gets a word, not a URL. */
function label(m: Message): string {
  const map: Record<string, string> = {
    Image: '📷 Photo', Video: '🎬 Video', File: '📎 File',
    Voice: '🎤 Voice message', Sticker: 'Sticker', Gift: '🎁 Gift',
  }
  if (m.isDeleted) return 'Deleted message'
  return m.type === 'Text' ? m.content : (map[m.type] ?? 'Message')
}

/**
 * Bar above the thread showing the pinned message. With several pins, tapping cycles
 * through them (and each tap jumps to that message in the thread).
 */
export function PinnedBar({ chatId, onJump }: { chatId: number; onJump: (id: number) => void }) {
  const pinned = useChat((s) => s.pinned[chatId])
  const togglePin = useChat((s) => s.togglePin)
  const [idx, setIdx] = useState(0)

  const list = pinned ?? []
  useEffect(() => { setIdx(0) }, [chatId])
  useEffect(() => { if (idx >= list.length) setIdx(0) }, [list.length, idx])

  if (list.length === 0) return null
  const cur = list[Math.min(idx, list.length - 1)]
  if (!cur) return null

  const advance = () => {
    onJump(cur.id)
    if (list.length > 1) setIdx((i) => (i + 1) % list.length)
  }

  return (
    <div className="pinned-bar">
      {list.length > 1 && (
        <span className="pin-rail" aria-hidden>
          {list.map((_, i) => <span key={i} className={i === Math.min(idx, list.length - 1) ? 'on' : ''} />)}
        </span>
      )}
      <Pin size={15} className="pin-ic" />
      <button className="pin-body" onClick={advance}
        title={list.length > 1 ? 'Go to pinned message (tap again for the next one)' : 'Go to pinned message'}>
        <span className="pin-title">
          Pinned message{list.length > 1 ? ` · ${Math.min(idx, list.length - 1) + 1}/${list.length}` : ''}
        </span>
        <span className="pin-text ellipsis">{label(cur)}</span>
      </button>
      <button className="icon-btn pin-off" aria-label="Unpin this message"
        title="Unpin" onClick={() => void togglePin(cur.id, chatId)}>
        <X size={17} />
      </button>
    </div>
  )
}
