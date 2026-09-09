import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat, onIncomingMessage, previewText } from '../store/chat'
import { useNotify } from '../store/notify'
import {
  playPing, primeAudio, setTitleBadge, setFaviconBadge,
  requestNotificationPermission, showMessageNotification, setNotificationClickHandler,
  notificationsSupported,
} from '../lib/notifications'
import type { Message } from '../lib/types'

/** Short label for a message in a notification body / title blink. */
function preview(m: Message): string {
  const label: Record<string, string> = {
    Image: '📷 Photo', Video: '🎬 Video', File: '📎 File',
    Voice: '🎤 Voice message', Sticker: 'Sticker', Gift: '🎁 Gift',
  }
  if (m.isDeleted) return 'Message deleted'
  return m.type === 'Text' ? m.content : (label[m.type] ?? 'Message')
}

/**
 * Drives every in-app notification channel: ping, tab title, favicon badge and the
 * Notification API. Mounted once from the shell.
 */
export function useNotifications() {
  const navigate = useNavigate()
  const chats = useChat((s) => s.chats)
  const soundOn = useNotify((s) => s.sound)
  const browserOn = useNotify((s) => s.browser)
  const setPermission = useNotify((s) => s.setPermission)
  const askedRef = useRef(false)
  const latestRef = useRef<string | null>(null)

  const totalUnread = chats.reduce((n, c) => n + (c.unreadCount || 0), 0)

  useEffect(() => { primeAudio() }, [])

  // clicking a notification focuses the tab and opens that chat
  useEffect(() => {
    setNotificationClickHandler((chatId) => navigate(`/chat/${chatId}`))
  }, [navigate])

  // title + favicon follow the unread count, and re-render when the tab is hidden/shown
  useEffect(() => {
    const apply = () => setTitleBadge(totalUnread, latestRef.current)
    apply()
    setFaviconBadge(totalUnread)
    document.addEventListener('visibilitychange', apply)
    return () => document.removeEventListener('visibilitychange', apply)
  }, [totalUnread])

  useEffect(() => onIncomingMessage(({ message, isActiveChat, isMuted }) => {
    // Reading the chat right now? No ping, no toast — you already see it.
    // Muted chat? No sound, no browser notification, no title blink either.
    if (isActiveChat || isMuted) return

    const from = message.senderName || 'New message'
    latestRef.current = `${from}: ${preview(message)}`.slice(0, 80)

    if (soundOn) playPing()

    if (!browserOn || !notificationsSupported()) return
    if (document.hidden) {
      // Politely ask the first time it would actually be useful — not on page load.
      if (Notification.permission === 'default' && !askedRef.current) {
        askedRef.current = true
        void requestNotificationPermission().then((p) => {
          setPermission(p)
          if (p === 'granted') showMessageNotification({ title: from, body: preview(message), chatId: message.chatId })
        })
        return
      }
      showMessageNotification({ title: from, body: preview(message), chatId: message.chatId })
    }
  }), [soundOn, browserOn, setPermission])

  // keep previewText referenced for the chat-list label parity
  void previewText
}
