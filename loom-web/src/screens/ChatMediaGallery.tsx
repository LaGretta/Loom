import { useMemo, useState } from 'react'
import { FileText, Download } from 'lucide-react'
import { useChat } from '../store/chat'
import { Segmented, EmptyState } from '../ui/primitives'
import { Lightbox, type LightboxItem } from '../ui/Lightbox'
import { fileSize } from '../ui/format'
import type { Message } from '../lib/types'

type Tab = 'media' | 'files'

const monthKey = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const monthLabel = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  return d.toLocaleDateString([], {
    month: 'long',
    ...(d.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  })
}

function groupByMonth(list: Message[]) {
  const map = new Map<string, { label: string; items: Message[] }>()
  // newest first, so the most recent month leads
  for (const m of [...list].sort((a, b) => b.sentAt.localeCompare(a.sentAt))) {
    const k = monthKey(m.sentAt)
    if (!map.has(k)) map.set(k, { label: monthLabel(m.sentAt), items: [] })
    map.get(k)!.items.push(m)
  }
  return [...map.values()]
}

const fileName = (url: string) => {
  try { return decodeURIComponent(new URL(url).pathname.split('/').pop() || 'file') }
  catch { return url.split('/').pop() || 'file' }
}

/**
 * Every photo and file from this chat, grouped by month. Built from the messages already
 * in the store — so it covers whatever history has been loaded, and grows as you scroll back.
 */
export function ChatMediaGallery({ chatId }: { chatId: number }) {
  const messages = useChat((s) => s.messages[chatId])
  const [tab, setTab] = useState<Tab>('media')
  const [openId, setOpenId] = useState<number | null>(null)

  const { photos, files } = useMemo(() => {
    const all = (messages ?? []).filter((m) => !m.isDeleted)
    return {
      photos: all.filter((m) => m.type === 'Image'),
      files: all.filter((m) => m.type === 'File' || m.type === 'Video'),
    }
  }, [messages])

  const lightboxItems = useMemo<LightboxItem[]>(
    () => [...photos]
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
      .map((m) => ({ id: m.id, url: m.content, caption: m.senderName })),
    [photos],
  )

  const groups = useMemo(() => groupByMonth(tab === 'media' ? photos : files), [tab, photos, files])
  const empty = groups.length === 0

  return (
    <>
      <div style={{ padding: '4px 16px 10px' }}>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'media', label: `Media${photos.length ? ` · ${photos.length}` : ''}` },
            { value: 'files', label: `Files${files.length ? ` · ${files.length}` : ''}` },
          ]}
        />
      </div>

      {empty ? (
        <EmptyState
          title={tab === 'media' ? 'No photos yet' : 'No files yet'}
          subtitle={
            tab === 'media'
              ? 'Photos shared in this chat will collect here.'
              : 'Files and videos shared in this chat will collect here.'
          }
        />
      ) : (
        groups.map((g) => (
          <div key={g.label}>
            <div className="section-label">{g.label}</div>
            {tab === 'media' ? (
              <div className="media-grid">
                {g.items.map((m) => (
                  <button key={m.id} className="media-cell" onClick={() => setOpenId(m.id)} title="Open photo">
                    <img src={m.content} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="list-card">
                {g.items.map((m) => (
                  <a key={m.id} className="list-row" href={m.content} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                    <span className="obj-ic"><FileText size={22} /></span>
                    <span className="grow">
                      <span className="lr-title ellipsis" style={{ display: 'block' }}>{fileName(m.content)}</span>
                      <span className="lr-sub">
                        {m.type === 'Video' ? 'Video' : 'File'}
                        {m.attachments?.[0]?.fileSizeBytes ? ` · ${fileSize(m.attachments[0].fileSizeBytes)}` : ''}
                      </span>
                    </span>
                    <Download size={17} className="chev" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {openId != null && lightboxItems.length > 0 && (
        <Lightbox items={lightboxItems} startId={openId} onClose={() => setOpenId(null)} />
      )}
    </>
  )
}
