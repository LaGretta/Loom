import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BellOff, Bell, CheckCheck } from 'lucide-react'
import { useChat } from '../store/chat'
import { useDismiss } from '../ui/useDismiss'
import { useFocusTrap } from '../ui/useFocusTrap'
import type { Chat } from '../lib/types'

/** Context menu for a chat-list row (right-click on desktop, long-press on touch). */
export function ChatRowMenu({ chat, at, onClose }: {
  chat: Chat; at: { x: number; y: number }; onClose: () => void
}) {
  const toggleMute = useChat((s) => s.toggleMute)
  const openChat = useChat((s) => s.openChat)
  const { closing, dismiss } = useDismiss(onClose)
  const boxRef = useRef<HTMLDivElement>(null)
  useFocusTrap(boxRef, !closing)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    // offsetWidth/Height, not getBoundingClientRect: the entrance animation scales the box,
    // and a mid-flight rect would place the popover over its own trigger.
    const width = el.offsetWidth
    const height = el.offsetHeight
    const M = 10
    let left = at.x
    let top = at.y
    if (left + width + M > window.innerWidth) left = at.x - width
    if (left < M) left = M
    if (top + height + M > window.innerHeight) top = at.y - height
    if (top < M) top = M
    setPos({ left, top })
  }, [at.x, at.y])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    const onScroll = () => dismiss()
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll, true) }
  }, [dismiss])

  const act = (fn: () => void) => { fn(); dismiss() }

  return (
    <div className={`ctx-wrap ${closing ? 'out-scrim' : ''}`} onMouseDown={dismiss}
      onContextMenu={(e) => { e.preventDefault(); dismiss() }}>
      <div ref={boxRef} role="menu" aria-label={`${chat.title ?? 'Chat'} actions`}
        className={`ctx-anchor anim-menu ${closing ? 'out-menu' : ''}`}
        style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, opacity: 0, pointerEvents: 'none' }}
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="ctx-card">
          <button className="ctx-item" role="menuitem" onClick={() => act(() => void toggleMute(chat.id))}>
            {chat.isMuted ? <><Bell size={18} /> Unmute</> : <><BellOff size={18} /> Mute</>}
          </button>
          {chat.unreadCount > 0 && (
            <button className="ctx-item" role="menuitem" onClick={() => act(() => void openChat(chat.id))}>
              <CheckCheck size={18} /> Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
