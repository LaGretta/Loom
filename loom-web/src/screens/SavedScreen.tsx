import { Overlay } from '../ui/Overlay'
import { CraftedObject } from '../ui/CraftedObject'

// Saved messages have no backend endpoint yet. // TODO: wire to backend
export function SavedScreen() {
  return (
    <Overlay title="Saved">
      <div className="empty" style={{ height: '70vh' }}>
        <CraftedObject id="s-bookmark" size={80} />
        <div className="et">No saved messages</div>
        <div>Long-press a message and tap Save to keep it here.</div>
      </div>
    </Overlay>
  )
}
