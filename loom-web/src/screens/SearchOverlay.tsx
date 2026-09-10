import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, X, MessageCircle } from 'lucide-react'
import { messagesApi } from '../lib/api'
import { CenterSpinner, EmptyState, ErrorState, Spinner } from '../ui/primitives'
import { Avatar } from '../ui/Avatar'
import { chatListTime } from '../ui/format'
import { useDismiss } from '../ui/useDismiss'
import { useFocusTrap } from '../ui/useFocusTrap'
import type { MessageSearchResult } from '../lib/types'

const MIN_CHARS = 2
const PAGE_SIZE = 30
const DEBOUNCE_MS = 280

/** Split a snippet around every case-insensitive occurrence of the term. */
function highlight(text: string, term: string) {
  const t = term.trim()
  if (!t) return text
  const parts: (string | { hit: string })[] = []
  const lower = text.toLowerCase()
  const needle = t.toLowerCase()
  let i = 0
  while (i < text.length) {
    const at = lower.indexOf(needle, i)
    if (at === -1) { parts.push(text.slice(i)); break }
    if (at > i) parts.push(text.slice(i, at))
    parts.push({ hit: text.slice(at, at + needle.length) })
    i = at + needle.length
  }
  return parts.map((p, k) => (typeof p === 'string' ? p : <mark key={k} className="sr-hit">{p.hit}</mark>))
}

/** Keep ~40 characters of lead-in before the first match so the snippet shows context. */
function snippet(content: string, term: string): string {
  const at = content.toLowerCase().indexOf(term.trim().toLowerCase())
  if (at <= 60) return content
  return '…' + content.slice(Math.max(0, at - 40))
}

/**
 * Message search. Global by default (Cmd/Ctrl+K); pass `chatId` to scope it to one
 * conversation. Results come back newest-first and are grouped by chat for scanning.
 */
export function SearchOverlay({ chatId = null, chatTitle, onClose }: {
  chatId?: number | null
  chatTitle?: string
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { closing, dismiss } = useDismiss(onClose)
  const cardRef = useRef<HTMLDivElement>(null)
  useFocusTrap(cardRef, !closing)

  const [q, setQ] = useState('')
  const [items, setItems] = useState<MessageSearchResult[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [state, setState] = useState<'idle' | 'loading' | 'more' | 'ready' | 'error'>('idle')
  const reqId = useRef(0)

  const term = q.trim()
  const tooShort = term.length > 0 && term.length < MIN_CHARS

  const run = useCallback(async (query: string, nextPage: number) => {
    const mine = ++reqId.current
    setState(nextPage === 1 ? 'loading' : 'more')
    try {
      const res = await messagesApi.search({ query, chatId, page: nextPage, pageSize: PAGE_SIZE })
      if (mine !== reqId.current) return                 // a newer keystroke already won
      setItems((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]))
      setPage(nextPage)
      setHasMore(res.items.length === PAGE_SIZE && nextPage * PAGE_SIZE < (res.totalCount ?? Infinity))
      setState('ready')
    } catch {
      if (mine !== reqId.current) return
      setState('error')
    }
  }, [chatId])

  // debounce: one request per pause, not one per keystroke
  useEffect(() => {
    if (term.length < MIN_CHARS) {
      reqId.current++
      setItems([]); setPage(1); setHasMore(false); setState('idle')
      return
    }
    const t = window.setTimeout(() => void run(term, 1), DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [term, run])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); dismiss() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss])

  // group consecutive results by chat, preserving the server's ordering
  const groups = useMemo(() => {
    const out: { chatId: number; chatTitle: string; rows: MessageSearchResult[] }[] = []
    for (const r of items) {
      const last = out[out.length - 1]
      if (last && last.chatId === r.chatId) last.rows.push(r)
      else out.push({ chatId: r.chatId, chatTitle: r.chatTitle, rows: [r] })
    }
    return out
  }, [items])

  const open = (r: MessageSearchResult) => {
    dismiss()
    navigate(`/chat/${r.chatId}`, { state: { jumpTo: r.messageId } })
  }

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || state === 'more' || state === 'loading') return
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) void run(term, page + 1)
  }

  return (
    <div className={`scrim search-scrim anim-scrim ${closing ? 'out-scrim' : ''}`} onMouseDown={dismiss}>
      <div ref={cardRef} className={`search-card anim-menu ${closing ? 'out-menu' : ''}`}
        role="dialog" aria-modal="true" aria-label={chatId ? `Search in ${chatTitle ?? 'this chat'}` : 'Search messages'}
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="search-card-head">
          <SearchIcon size={18} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={chatId ? `Search in ${chatTitle ?? 'this chat'}` : 'Search all messages'}
            aria-label="Search messages"
          />
          <button className="icon-btn" onClick={dismiss} aria-label="Close search"><X size={19} /></button>
        </div>

        <div className="search-card-body scroll-y" onScroll={onScroll}>
          {state === 'idle' && (
            <EmptyState
              icon={<SearchIcon size={34} strokeWidth={1.4} />}
              title={tooShort ? 'Keep typing' : (chatId ? 'Search this chat' : 'Search your messages')}
              subtitle={tooShort ? `At least ${MIN_CHARS} characters` : 'Text messages from every chat you’re in.'}
            />
          )}
          {state === 'loading' && <CenterSpinner />}
          {state === 'error' && <ErrorState subtitle="Search didn’t come back." onRetry={() => void run(term, 1)} />}
          {(state === 'ready' || state === 'more') && items.length === 0 && (
            <EmptyState icon={<MessageCircle size={34} strokeWidth={1.4} />} title="No matches"
              subtitle={`Nothing found for “${term}”.`} />
          )}

          {groups.map((g) => (
            <div key={`${g.chatId}-${g.rows[0].messageId}`}>
              {!chatId && (
                <div className="sr-chat">
                  <Avatar name={g.chatTitle || 'Chat'} id={g.chatId} size={22} />
                  <span className="ellipsis">{g.chatTitle || 'Chat'}</span>
                </div>
              )}
              {g.rows.map((r) => (
                <button key={r.messageId} className="sr-row" onClick={() => open(r)}>
                  <span className="sr-top">
                    <span className="sr-who ellipsis">{r.senderName}</span>
                    <span className="sr-when">{chatListTime(r.sentAt)}</span>
                  </span>
                  <span className="sr-text">{highlight(snippet(r.content, term), term)}</span>
                </button>
              ))}
            </div>
          ))}

          {state === 'more' && <div className="sr-more"><Spinner /></div>}
        </div>
      </div>
    </div>
  )
}
