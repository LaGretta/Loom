import { Overlay } from '../ui/Overlay'
import { CraftedObject } from '../ui/CraftedObject'
import { LOOMI_POSES, STAR_POSES } from '../assets/loom'
import { toast } from '../ui/toast'

// Sticker pack listing (Settings/hub). Same poses power the composer picker.
export function StickersScreen() {
  return (
    <Overlay title="Stickers">
      {[{ name: 'Loomi', poses: LOOMI_POSES }, { name: 'Star Buddy', poses: STAR_POSES }].map((pack) => (
        <div key={pack.name}>
          <div className="section-label">{pack.name}</div>
          <div className="sticker-grid" style={{ padding: '0 16px 16px' }}>
            {pack.poses.map((p) => (
              <button key={p} className="sticker-cell" onClick={() => toast('Open a chat to send stickers')}>
                <CraftedObject id={p} kind="sticker" size={72} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="muted" style={{ textAlign: 'center', fontSize: 12.5, padding: 12 }}>
        Sticker pack management is a planned feature — packs are built in.
      </div>
    </Overlay>
  )
}
