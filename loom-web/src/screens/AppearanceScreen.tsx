import { Overlay } from '../ui/Overlay'
import { CraftedObject } from '../ui/CraftedObject'
import { Segmented } from '../ui/primitives'
import { useTheme, THEMES, WALLPAPERS, type ThemeMode } from '../store/theme'
import { Check } from 'lucide-react'

export function AppearanceScreen() {
  const { theme, mode, wallpaper, setTheme, setMode, setWallpaper } = useTheme()

  return (
    <Overlay title="Appearance">
      <div style={{ padding: '8px 16px' }}>
        {/* Mode */}
        <div className="section-label" style={{ padding: '10px 2px 8px' }}>Mode</div>
        <Segmented<ThemeMode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'light', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><CraftedObject id="s-sun" size={20} /> Light</span> },
            { value: 'dark', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><CraftedObject id="s-moon" size={20} /> Dark</span> },
          ]}
        />

        {/* Theme swatches */}
        <div className="section-label" style={{ padding: '20px 2px 8px' }}>Theme</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {THEMES.map((t) => (
            <button key={t.id} onClick={() => setTheme(t.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: 'none', background: 'transparent' }}>
              <span data-theme={t.id} data-mode={mode} style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-grad)', display: 'grid', placeItems: 'center', boxShadow: theme === t.id ? '0 0 0 2.5px var(--ring)' : 'inset 0 0 0 1px var(--hairline)' }}>
                {theme === t.id && <Check size={20} color="var(--on-accent)" />}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Wallpaper */}
        <div className="section-label" style={{ padding: '20px 2px 8px' }}>Chat wallpaper</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {WALLPAPERS.map((w) => (
            <button key={w.id} onClick={() => setWallpaper(w.id)}
              style={{ position: 'relative', height: 96, borderRadius: 14, overflow: 'hidden', border: wallpaper === w.id ? '2.5px solid var(--ring)' : '1px solid var(--hairline)', background: 'var(--bg)' }}>
              <WallpaperThumb id={w.id} />
              <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '4px 8px', fontSize: 12, fontWeight: 600, background: 'var(--glass)', backdropFilter: 'blur(8px)' }}>{w.label}</span>
              {wallpaper === w.id && <span style={{ position: 'absolute', top: 6, right: 6, background: 'var(--accent)', color: 'var(--on-accent)', borderRadius: '50%', width: 22, height: 22, display: 'grid', placeItems: 'center' }}><Check size={14} /></span>}
            </button>
          ))}
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
          Wallpaper is applied globally to chat backgrounds. Per-chat wallpapers are a planned feature.
        </div>
      </div>
    </Overlay>
  )
}

function WallpaperThumb({ id }: { id: string }) {
  if (id === 'aurora') return <div className="wp wp-aurora" style={{ position: 'absolute' }}><div className="blob b1" /><div className="blob b2" /><div className="blob b3" /></div>
  if (id === 'silk') return <div className="wp wp-silk" style={{ position: 'absolute' }} />
  if (id === 'dither') return <div className="wp wp-dither" style={{ position: 'absolute' }} />
  if (id === 'shimmer') return <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, var(--surface-2), var(--bg))' }} />
  return <div style={{ position: 'absolute', inset: 0, background: 'var(--surface-2)' }} />
}
