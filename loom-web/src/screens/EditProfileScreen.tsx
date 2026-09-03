import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { Overlay } from '../ui/Overlay'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/primitives'
import { useAuth } from '../store/auth'
import { usersApi, mediaApi } from '../lib/api'
import { toast } from '../ui/toast'

const BIO_MAX = 140

export function EditProfileScreen() {
  const me = useAuth((s) => s.me)
  const setMe = useAuth((s) => s.setMe)
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(me?.displayName ?? '')
  const [bio, setBio] = useState(me?.bio ?? '')
  const [avatar, setAvatar] = useState(me?.avatarUrl ?? null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadAvatar = async (file: File) => {
    setBusy(true)
    try {
      const { url } = await mediaApi.upload(file)
      setAvatar(url)
      toast('Avatar uploaded — Save to apply')
    } catch { toast('Upload failed') }
    finally { setBusy(false) }
  }

  const save = async () => {
    if (!displayName.trim()) { toast('Name cannot be empty'); return }
    setBusy(true)
    try {
      // Backend PUT /users/me now accepts avatarUrl and persists it.
      const updated = await usersApi.update({ displayName: displayName.trim(), bio: bio.trim() || null, avatarUrl: avatar })
      setMe(updated)
      toast('Profile saved')
      navigate(-1)
    } catch (e: any) { toast(e?.message ?? 'Could not save') }
    finally { setBusy(false) }
  }

  return (
    <Overlay title="Edit profile"
      right={<button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => void save()} disabled={busy}>{busy ? '…' : 'Save'}</button>}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 0 8px' }}>
        <button onClick={() => fileRef.current?.click()} style={{ position: 'relative', border: 'none', background: 'transparent' }}>
          <Avatar name={displayName || me?.displayName || '?'} id={me?.id} src={avatar} size={96} />
          <span style={{ position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', border: '2px solid var(--bg)' }}>
            <Camera size={16} />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadAvatar(f); e.currentTarget.value = '' }} />
      </div>

      <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div className="field-label">Display name</div>
          <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />
        </div>
        <div>
          <div className="field-label">Bio</div>
          <textarea className="input" value={bio} onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))} placeholder="A little about you" />
          <div className="muted" style={{ fontSize: 12, textAlign: 'right', marginTop: 4 }}>{BIO_MAX - bio.length} characters left</div>
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>
          Username, website and cover image aren’t editable yet.
        </div>
      </div>

      <div style={{ padding: '4px 16px' }}>
        <Button block onClick={() => void save()} disabled={busy}>Save changes</Button>
      </div>
    </Overlay>
  )
}
