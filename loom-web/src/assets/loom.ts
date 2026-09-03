// Facade over the three verbatim SVG libraries. Import once; call injectAllDefs() at app start.
import './loom-gifts.js'
import './loom-symbols.js'
import './loom-stickers.js'
import type { GiftMeta } from './loom-globals'

let injected = false
export function injectAllDefs(doc: Document = document) {
  if (injected) return
  window.LoomGifts?.injectDefs(doc)
  window.LoomSym?.injectDefs(doc)
  window.LoomStk?.injectDefs(doc)
  window.LoomGifts?.freezeIfReduced(doc)
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
