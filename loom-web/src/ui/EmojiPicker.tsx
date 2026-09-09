import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Search, Clock } from 'lucide-react'
import { useDismiss } from './useDismiss'
import { useFocusTrap } from './useFocusTrap'

/* A compact, dependency-free set: enough breadth to be useful, small enough to ship.
   Each entry is [emoji, keywords]. Skin-tone-capable ones are marked with `tone`. */
type Entry = [string, string, boolean?]

const CATEGORIES: { id: string; label: string; icon: string; items: Entry[] }[] = [
  { id: 'smileys', label: 'Smileys & people', icon: '🙂', items: [
    ['😀','grin smile happy'],['😃','smile happy joy'],['😄','laugh happy'],['😁','beam grin'],
    ['😆','laugh satisfied'],['😅','sweat laugh'],['🤣','rofl laughing'],['😂','joy tears laugh'],
    ['🙂','slight smile'],['🙃','upside down silly'],['😉','wink'],['😊','blush smile'],
    ['😇','innocent halo'],['🥰','love hearts adore'],['😍','heart eyes love'],['😘','kiss'],
    ['😗','kissing'],['😚','kissing closed'],['😋','yum tasty'],['😛','tongue'],
    ['🤪','zany crazy'],['🤨','raised eyebrow doubt'],['🧐','monocle inspect'],['🤓','nerd glasses'],
    ['😎','cool sunglasses'],['🥳','party celebrate'],['😏','smirk'],
    ['😒','unamused meh'],['😞','disappointed sad'],['😔','pensive sad'],['😟','worried'],
    ['😕','confused'],['🙁','frown'],['😣','persevere'],['😖','confounded'],
    ['😫','tired'],['😩','weary'],['🥺','pleading puppy'],['😢','cry sad tear'],
    ['😭','sob crying'],['😤','triumph steam'],['😠','angry'],['😡','rage mad'],
    ['🤯','mind blown'],['😳','flushed'],['🥵','hot'],['🥶','cold'],
    ['😱','scream fear'],['😨','fearful'],['😰','anxious'],['😥','sad relieved'],
    ['🤗','hug'],['🤔','thinking hmm'],['🤭','oops giggle'],['🤫','shush quiet'],
    ['😶','no mouth'],['😐','neutral'],['😑','expressionless'],['😬','grimace'],
    ['🙄','eye roll'],['😴','sleep zzz'],['🤤','drool'],['🤒','sick thermometer'],
    ['🤕','hurt bandage'],['🤢','nauseated'],['🤮','vomit'],['🥴','woozy'],
    ['👋','wave hi bye', true],['🤝','handshake deal'],['👍','thumbs up yes like', true],
    ['👎','thumbs down no', true],['👏','clap applause', true],['🙌','raise hands celebrate', true],
    ['🙏','pray thanks please', true],['💪','muscle strong', true],['🤞','fingers crossed luck', true],
    ['✌️','peace victory', true],['🤟','love you', true],['👌','ok perfect', true],
    ['👀','eyes look'],['🧠','brain'],['👶','baby', true],['🧑','person', true],
  ]},
  { id: 'nature', label: 'Animals & nature', icon: '🌿', items: [
    ['🐶','dog puppy'],['🐱','cat kitten'],['🐭','mouse'],['🐹','hamster'],['🐰','rabbit bunny'],
    ['🦊','fox'],['🐻','bear'],['🐼','panda'],['🐨','koala'],['🐯','tiger'],
    ['🦁','lion'],['🐮','cow'],['🐷','pig'],['🐸','frog'],['🐵','monkey'],
    ['🐔','chicken'],['🐧','penguin'],['🐦','bird'],['🦆','duck'],['🦉','owl'],
    ['🐝','bee'],['🦋','butterfly'],['🐢','turtle'],['🐙','octopus'],['🐳','whale'],
    ['🐬','dolphin'],['🦄','unicorn'],['🌸','blossom flower'],['🌹','rose flower'],['🌻','sunflower'],
    ['🌿','herb plant'],['🍀','clover luck'],['🌲','tree'],['🌊','wave water'],['🔥','fire hot lit'],
    ['⭐','star'],['🌟','glowing star'],['✨','sparkles'],['🌈','rainbow'],['☀️','sun'],
    ['🌙','moon'],['❄️','snow cold'],['⚡','lightning bolt'],['💧','droplet'],
  ]},
  { id: 'food', label: 'Food & drink', icon: '🍕', items: [
    ['🍏','apple green'],['🍎','apple red'],['🍌','banana'],['🍉','watermelon'],['🍇','grapes'],
    ['🍓','strawberry'],['🍒','cherries'],['🍑','peach'],['🥑','avocado'],['🍅','tomato'],
    ['🥐','croissant'],['🍞','bread'],['🧀','cheese'],['🍔','burger'],['🍟','fries'],
    ['🍕','pizza'],['🌮','taco'],['🍣','sushi'],['🍜','noodles ramen'],['🍰','cake'],
    ['🎂','birthday cake'],['🍪','cookie'],['🍫','chocolate'],['🍿','popcorn'],['🍩','donut'],
    ['☕','coffee'],['🍵','tea'],['🧃','juice'],['🍺','beer'],['🍷','wine'],['🥂','cheers toast'],
  ]},
  { id: 'activity', label: 'Activity & travel', icon: '⚽', items: [
    ['⚽','soccer football'],['🏀','basketball'],['🏈','football'],['🎾','tennis'],['🏐','volleyball'],
    ['🎱','pool 8ball'],['🏓','ping pong'],['🥅','goal'],['🏆','trophy win'],['🥇','gold medal'],
    ['🎮','game controller'],['🎧','headphones music'],['🎸','guitar'],['🎹','piano'],['🎤','mic sing'],
    ['🎬','movie clapper'],['🎨','art palette'],['🚗','car'],['✈️','plane travel'],['🚀','rocket launch'],
    ['🚲','bike'],['🏝️','island beach'],['🏔️','mountain'],['🗺️','map'],['🧳','luggage'],
  ]},
  { id: 'objects', label: 'Objects & symbols', icon: '💡', items: [
    ['💡','idea bulb'],['💻','laptop computer'],['📱','phone mobile'],['⌨️','keyboard'],['🖥️','desktop'],
    ['📷','camera photo'],['🔒','lock'],['🔑','key'],['📎','paperclip attach'],['✂️','scissors'],
    ['📌','pin'],['📅','calendar date'],['📝','memo note'],['📚','books'],['💰','money bag'],
    ['🎁','gift present'],['🎉','party popper'],['🎈','balloon'],['❤️','heart love red'],
    ['🧡','orange heart'],['💛','yellow heart'],['💚','green heart'],['💙','blue heart'],
    ['💜','purple heart'],['🖤','black heart'],['🤍','white heart'],['💔','broken heart'],
    ['💯','hundred perfect'],['✅','check done yes'],['❌','cross no'],['⚠️','warning'],
    ['❓','question'],['❗','exclamation'],['💤','sleep zzz'],['👑','crown'],
  ]},
]

const TONES = ['', '🏻', '🏼', '🏽', '🏾', '🏿']
const RECENTS_KEY = 'loom.emoji.recents'
const TONE_KEY = 'loom.emoji.tone'
const MAX_RECENTS = 24

const readRecents = (): string[] => {
  try { const v = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'); return Array.isArray(v) ? v : [] }
  catch { return [] }
}
const pushRecent = (e: string) => {
  try {
    const next = [e, ...readRecents().filter((x) => x !== e)].slice(0, MAX_RECENTS)
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
  } catch { /* ignore */ }
}
const readTone = (): number => {
  try { return Math.min(5, Math.max(0, Number(localStorage.getItem(TONE_KEY)) || 0)) } catch { return 0 }
}

/** Apply the chosen skin tone to emoji that support one. */
const withTone = (e: Entry, tone: number) => (e[2] && tone > 0 ? e[0] + TONES[tone] : e[0])

export function EmojiPicker({ at, onPick, onClose, closeOnPick = true }: {
  at: { x: number; y: number }
  onPick: (emoji: string) => void
  onClose: () => void
  /** Reactions pick one and are done; the composer stays open so you can add several. */
  closeOnPick?: boolean
}) {
  const { closing, dismiss } = useDismiss(onClose)
  const boxRef = useRef<HTMLDivElement>(null)
  useFocusTrap(boxRef, !closing)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(CATEGORIES[0].id)
  const [tone, setTone] = useState(readTone)
  const [recents, setRecents] = useState(readRecents)

  const place = useCallback(() => {
    const el = boxRef.current
    if (!el) return
    // offsetWidth/Height, not getBoundingClientRect: the entrance animation scales the box,
    // and a mid-flight rect would place the popover over its own trigger.
    const width = el.offsetWidth
    const height = el.offsetHeight
    const M = 10
    let left = at.x - width / 2
    let top = at.y - height - 8               // prefer opening above the trigger
    if (top < M) top = at.y + 8
    left = Math.min(Math.max(M, left), window.innerWidth - width - M)
    top = Math.min(Math.max(M, top), window.innerHeight - height - M)
    setPos({ left, top })
  }, [at.x, at.y])

  useLayoutEffect(place, [place])

  // Rotation, or the mobile keyboard opening under the search field, moves the goalposts.
  useEffect(() => {
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [place])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); dismiss() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return null
    return CATEGORIES.flatMap((c) => c.items).filter((e) => e[1].includes(term)).slice(0, 60)
  }, [q])

  const choose = (emoji: string) => {
    pushRecent(emoji)
    setRecents(readRecents())
    onPick(emoji)
    if (closeOnPick) dismiss()
  }

  const active = CATEGORIES.find((c) => c.id === cat) ?? CATEGORIES[0]

  return (
    <div className={`ctx-wrap ${closing ? 'out-scrim' : ''}`} onMouseDown={dismiss}>
      <div
        ref={boxRef}
        role="dialog"
        aria-label="Emoji picker"
        className={`emoji-pop anim-menu ${closing ? 'out-menu' : ''}`}
        style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, opacity: 0, pointerEvents: 'none' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="emoji-head">
          <div className="search emoji-search">
            <Search size={15} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search emoji" aria-label="Search emoji" autoFocus />
          </div>
          <select
            className="emoji-tone"
            aria-label="Skin tone"
            value={tone}
            onChange={(e) => {
              const t = Number(e.target.value)
              setTone(t)
              try { localStorage.setItem(TONE_KEY, String(t)) } catch { /* ignore */ }
            }}
          >
            {TONES.map((t, i) => <option key={i} value={i}>{t || '👋'}</option>)}
          </select>
        </div>

        <div className="emoji-body">
          {results ? (
            results.length === 0
              ? <div className="emoji-empty">Nothing matches “{q}”</div>
              : <div className="emoji-grid">
                  {results.map((e, i) => (
                    <button key={e[0] + i} onClick={() => choose(withTone(e, tone))} title={e[1]}>{withTone(e, tone)}</button>
                  ))}
                </div>
          ) : (
            <>
              {recents.length > 0 && cat === CATEGORIES[0].id && (
                <>
                  <div className="emoji-label"><Clock size={12} /> Recent</div>
                  <div className="emoji-grid">
                    {recents.map((e, i) => <button key={e + i} onClick={() => choose(e)}>{e}</button>)}
                  </div>
                </>
              )}
              <div className="emoji-label">{active.label}</div>
              <div className="emoji-grid">
                {active.items.map((e, i) => (
                  <button key={e[0] + i} onClick={() => choose(withTone(e, tone))} title={e[1]}>{withTone(e, tone)}</button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="emoji-tabs" role="tablist" aria-label="Emoji categories">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={cat === c.id && !q}
              className={cat === c.id && !q ? 'on' : ''}
              onClick={() => { setQ(''); setCat(c.id) }}
              title={c.label}
              aria-label={c.label}
            >{c.icon}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
