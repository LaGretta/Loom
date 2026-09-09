import { Switch, Button } from '../ui/primitives'
import { CraftedObject } from '../ui/CraftedObject'
import { useNotify } from '../store/notify'
import {
  playPing, requestNotificationPermission, showMessageNotification, notificationsSupported,
} from '../lib/notifications'
import { toast } from '../ui/toast'

/** Notifications block inside Settings. Everything here is in-app only and stored locally. */
export function NotificationSettings() {
  const { sound, browser, permission, setSound, setBrowser, setPermission } = useNotify()
  const supported = notificationsSupported()
  const denied = permission === 'denied'

  const enableBrowser = async (on: boolean) => {
    setBrowser(on)
    if (!on || !supported) return
    const p = await requestNotificationPermission()
    setPermission(p)
    if (p === 'denied') toast('Notifications are blocked in your browser settings')
  }

  const test = async () => {
    if (sound) playPing()
    if (browser && supported) {
      const p = permission === 'granted' ? permission : await requestNotificationPermission()
      setPermission(p)
      if (p === 'granted') {
        showMessageNotification({ title: 'Loom', body: 'This is what a notification looks like.', chatId: 0, tag: 'loom-test' })
        toast('Sent a test notification')
        return
      }
    }
    toast(sound ? 'Played the notification sound' : 'Nothing enabled to test')
  }

  return (
    <>
      <div className="section-label">Notifications</div>
      <div className="list-card">
        <div className="list-row" style={{ cursor: 'default' }}>
          <span className="obj-ic"><CraftedObject id="s-bell" size={30} /></span>
          <span className="grow">
            <span className="lr-title">Sound</span>
            <span className="lr-sub" style={{ display: 'block' }}>A short ping for messages in other chats</span>
          </span>
          <Switch on={sound} onChange={setSound} />
        </div>

        <div className="list-row" style={{ cursor: 'default' }}>
          <span className="obj-ic"><CraftedObject id="s-globe" size={30} /></span>
          <span className="grow">
            <span className="lr-title">Browser notifications</span>
            <span className="lr-sub" style={{ display: 'block' }}>
              {!supported ? 'Not supported in this browser'
                : denied ? 'Blocked — enable them in browser site settings'
                  : permission === 'granted' ? 'Shown when the tab is in the background'
                    : 'You’ll be asked the first time one is needed'}
            </span>
          </span>
          <Switch on={browser && supported && !denied} onChange={(v) => void enableBrowser(v)} />
        </div>
      </div>

      <div style={{ padding: '0 16px 8px' }}>
        <Button variant="secondary" block onClick={() => void test()}>Send a test notification</Button>
      </div>
      <div className="muted" style={{ fontSize: 12.5, padding: '0 18px 14px' }}>
        These work while Loom is open (including a background tab). Notifications with the app
        fully closed need push support on the server.
      </div>
    </>
  )
}
