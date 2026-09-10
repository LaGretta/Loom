// Facade over the three verbatim SVG libraries. Import once; call injectAllDefs() at app start.
import './loom-symbols.js'
import './loom-stickers.js'
import type { GiftMeta } from './loom-globals'

/* The gift library is ~90 kB of verbatim SVG and is only needed on gift surfaces (the
   catalog, the profile showcase, an in-chat gift card). Everything else — nav symbols,
   stickers, empty states — is needed immediately, so only this one is split out. */
type GiftsReady = () => void
let giftsLoading: Promise<void> | null = null
const giftsWaiters = new Set<GiftsReady>()

export function giftsLoaded(): boolean { return typeof window !== 'undefined' && !!window.LoomGifts }

/** Kick off (or join) the gift-library load; resolves once window.LoomGifts is live. */
export function loadGifts(): Promise<void> {
  if (giftsLoaded()) return Promise.resolve()
  if (!giftsLoading) {
    giftsLoading = import('./loom-gifts.js').then(() => {
      if (typeof document !== 'undefined') {
        window.LoomGifts?.injectDefs(document)
        window.LoomGifts?.freezeIfReduced(document)
      }
      giftsWaiters.forEach((fn) => fn())
      giftsWaiters.clear()
    })
  }
  return giftsLoading
}

/** Re-render hook for components that draw gifts: fires once the library lands. */
export function onGiftsReady(fn: GiftsReady): () => void {
  if (giftsLoaded()) { fn(); return () => {} }
  giftsWaiters.add(fn)
  void loadGifts()
  return () => giftsWaiters.delete(fn)
}

let injected = false
export function injectAllDefs(doc: Document = document) {
  if (injected) return
  window.LoomSym?.injectDefs(doc)
  window.LoomStk?.injectDefs(doc)
  window.LoomSym?.freezeIfReduced(doc)
  injected = true
}

/** Crafted 3D hero/UI object (s-coin, s-gem, …) → svg markup string. */
export const symHTML = (id: string, size = 120) => window.LoomSym?.svgHTML(id, size) ?? ''
/** Collectible gift object (g-fox, g-nebula, …) → svg markup string. */
export const giftHTML = (id: string, size = 120) => window.LoomGifts?.svgHTML(id, size) ?? ''
/** Sticker pose (loomi-wave, star-love, …) → svg markup string. */
export const stickerHTML = (id: string, size = 96) => window.LoomStk?.svgHTML(id, size) ?? ''

export const GIFT_CATALOG: GiftMeta[] = (typeof window !== 'undefined' && window.LoomGifts?.CATALOG) || []
export const LOOMI_POSES = (typeof window !== 'undefined' && window.LoomStk?.LOOMI) || []
export const STAR_POSES = (typeof window !== 'undefined' && window.LoomStk?.STAR) || []

export function giftByName(name: string): GiftMeta | undefined {
  return window.LoomGifts?.find(name)
}

export type { GiftMeta }
