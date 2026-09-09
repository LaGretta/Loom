import type { Message } from './types'

/** Messages that couldn't reach the server yet. Persisted so a reload never loses them. */
export interface OutboxItem {
  tempId: number
  chatId: number
  content: string
  type: Message['type']
  replyToMessageId: number | null
  replyToPreview: string | null
  sentAt: string
}

const KEY = 'loom.outbox'

export function readOutbox(): OutboxItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch { return [] }
}

function write(items: OutboxItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* quota / private mode */ }
}

export function addToOutbox(item: OutboxItem) {
  const all = readOutbox()
  if (all.some((i) => i.tempId === item.tempId)) return
  all.push(item)                    // append: the queue flushes in send order
  write(all)
}

export function removeFromOutbox(tempId: number) {
  write(readOutbox().filter((i) => i.tempId !== tempId))
}

export function outboxFor(chatId: number): OutboxItem[] {
  return readOutbox().filter((i) => i.chatId === chatId)
}
