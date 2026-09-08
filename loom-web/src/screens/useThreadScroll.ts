import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { Message } from '../lib/types'

/** Scroll offset per chat, kept across mounts so returning to a chat lands where you left. */
const scrollMemory = new Map<number, number>()

const BOTTOM_SLOP = 80    // within this many px counts as "at the bottom"
const LOAD_TRIGGER = 140  // start fetching older history this far from the top

const isAtBottom = (el: HTMLElement) =>
  el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_SLOP

/**
 * Thread scrolling that behaves like a real messenger:
 *  - opening a chat lands at the remembered position (else the bottom) before first paint
 *  - loading older history keeps the reading position pinned (scroll anchoring)
 *  - a new message only auto-scrolls when you're already at the bottom; otherwise it
 *    counts into a "new messages" pill
 */
export function useThreadScroll({ chatId, messages, hasMore, loadMore, myId }: {
  chatId: number
  messages: Message[] | undefined
  hasMore: boolean | undefined
  loadMore: (chatId: number) => Promise<void>
  myId: number | undefined
}) {
  const threadRef = useRef<HTMLDivElement>(null)
  const [newCount, setNewCount] = useState(0)

  const atBottom = useRef(true)
  const anchor = useRef<{ h: number; top: number } | null>(null)
  const loadingOlder = useRef(false)
  const restoredFor = useRef<number | null>(null)
  const prevFirstId = useRef<number | null>(null)
  const prevLastId = useRef<number | null>(null)
  const prevLen = useRef(0)

  /**
   * Scroll to the bottom and GUARANTEE arrival. Some engines (and reduced-motion or
   * background tabs) ignore `behavior:'smooth'` entirely, which would silently strand
   * the user mid-thread — so we verify shortly after and hard-set if we didn't land.
   */
  const goBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = threadRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
    atBottom.current = true
    if (behavior === 'smooth') {
      window.setTimeout(() => {
        const e2 = threadRef.current
        if (e2 && e2.scrollHeight - e2.scrollTop - e2.clientHeight > 4) e2.scrollTop = e2.scrollHeight
      }, 320)
    }
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    goBottom(behavior)
    setNewCount(0)
  }, [goBottom])

  // NOTE: no save-on-cleanup here. A [chatId] cleanup runs *after* the DOM has already
  // switched to the new chat, so it would write the new chat's offset into the old chat's
  // slot. onScroll keeps scrollMemory current for whichever chat is on screen.

  useLayoutEffect(() => {
    const el = threadRef.current
    if (!el) return
    const list = messages ?? []
    const firstId = list.length ? list[0].id : null
    const lastId = list.length ? list[list.length - 1].id : null

    // --- first population of this chat: reset transient state, then restore the
    //     position BEFORE paint (no flash). Reset lives here, not in a separate
    //     effect, so it can never run after this one and clobber the seeded refs.
    if (restoredFor.current !== chatId) {
      atBottom.current = true
      anchor.current = null
      loadingOlder.current = false
      prevFirstId.current = null
      prevLastId.current = null
      prevLen.current = 0
      setNewCount(0)
      if (list.length === 0) return
      const saved = scrollMemory.get(chatId)
      el.scrollTop = saved != null && saved <= el.scrollHeight ? saved : el.scrollHeight
      restoredFor.current = chatId
      atBottom.current = isAtBottom(el)
      prevFirstId.current = firstId; prevLastId.current = lastId; prevLen.current = list.length
      return
    }

    // --- older history prepended: pin the reading position
    if (firstId !== prevFirstId.current && anchor.current) {
      el.scrollTop = el.scrollHeight - anchor.current.h + anchor.current.top
      anchor.current = null
      loadingOlder.current = false
    } else if (firstId === prevFirstId.current && anchor.current && !loadingOlder.current) {
      anchor.current = null // load returned nothing new
    } else if (lastId !== prevLastId.current && list.length > prevLen.current) {
      // --- appended at the bottom
      const added = list.slice(prevLen.current)
      const allMine = added.length > 0 && added.every((m) => m.senderId === myId)
      if (atBottom.current || allMine) {
        goBottom('smooth')
      } else {
        const incoming = added.filter((m) => m.senderId !== myId).length
        if (incoming > 0) setNewCount((c) => c + incoming)
      }
    }

    prevFirstId.current = firstId; prevLastId.current = lastId; prevLen.current = list.length
  }, [messages, chatId, myId, goBottom])

  const onScroll = useCallback(() => {
    const el = threadRef.current
    if (!el) return
    atBottom.current = isAtBottom(el)
    if (atBottom.current) setNewCount((c) => (c === 0 ? c : 0))
    scrollMemory.set(chatId, el.scrollTop)

    if (el.scrollTop < LOAD_TRIGGER && hasMore && !loadingOlder.current) {
      loadingOlder.current = true
      anchor.current = { h: el.scrollHeight, top: el.scrollTop }
      void loadMore(chatId).finally(() => { loadingOlder.current = false })
    }
  }, [chatId, hasMore, loadMore])

  return { threadRef, onScroll, newCount, scrollToBottom }
}
