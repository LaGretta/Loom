import { create } from 'zustand'

export type ThemeName = 'mono' | 'ink' | 'steel' | 'moss' | 'amber'
export type ThemeMode = 'light' | 'dark'
export type Wallpaper = 'aurora' | 'shimmer' | 'silk' | 'dither' | 'none'

const K_THEME = 'loom.theme'
const K_MODE = 'loom.mode'
const K_WP = 'loom.wallpaper'

export const THEMES: { id: ThemeName; label: string }[] = [
  { id: 'mono', label: 'Mono' },
  { id: 'ink', label: 'Ink' },
  { id: 'steel', label: 'Steel' },
  { id: 'moss', label: 'Moss' },
  { id: 'amber', label: 'Amber' },
]
export const WALLPAPERS: { id: Wallpaper; label: string }[] = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'shimmer', label: 'Shimmer' },
  { id: 'silk', label: 'Silk' },
  { id: 'dither', label: 'Dither' },
  { id: 'none', label: 'Plain' },
]

function read(k: string): string | null {
  try { return localStorage.getItem(k) } catch { return null }
}
function persist(k: string, v: string) { try { localStorage.setItem(k, v) } catch { /* ignore */ } }

// Project default = Mono / Dark + Aurora Drift wallpaper.
const initTheme = (read(K_THEME) as ThemeName) || 'mono'
const initMode = (read(K_MODE) as ThemeMode) || 'dark'
const initWp = (read(K_WP) as Wallpaper) || 'aurora'

interface ThemeState {
  theme: ThemeName
  mode: ThemeMode
  wallpaper: Wallpaper
  setTheme: (t: ThemeName) => void
  setMode: (m: ThemeMode) => void
  toggleMode: () => void
  setWallpaper: (w: Wallpaper) => void
}

function apply(theme: ThemeName, mode: ThemeMode) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-mode', mode)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#000000' : '#ffffff')
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: initTheme,
  mode: initMode,
  wallpaper: initWp,
  setTheme: (theme) => { persist(K_THEME, theme); apply(theme, get().mode); set({ theme }) },
  setMode: (mode) => { persist(K_MODE, mode); apply(get().theme, mode); set({ mode }) },
  toggleMode: () => get().setMode(get().mode === 'dark' ? 'light' : 'dark'),
  setWallpaper: (wallpaper) => { persist(K_WP, wallpaper); set({ wallpaper }) },
}))

// Apply immediately on module load so first paint matches.
apply(initTheme, initMode)
