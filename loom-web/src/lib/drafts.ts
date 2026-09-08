/** Per-chat composer drafts, persisted so they survive reloads and chat switches. */
const KEY = 'loom.drafts'

function read(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
function write(all: Record<string, string>) {
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* quota / private mode */ }
}

export function getDraft(chatId: number): string {
  return read()[String(chatId)] ?? ''
}

export function setDraft(chatId: number, text: string) {
  const all = read()
  const k = String(chatId)
  if (text.trim()) all[k] = text
  else delete all[k]
  write(all)
}
