// Type surface for the three verbatim SVG libraries (loaded as side-effect IIFEs).
export interface GiftMeta {
  n: number
  name: string
  sym: string
  g1: string
  g2: string
  r: 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  ed: string
  pr: string
}

interface LoomGiftsAPI {
  CATALOG: GiftMeta[]
  find(key: string): GiftMeta | undefined
  injectDefs(doc?: Document): void
  svgHTML(sym: string, size?: number): string
  cardHTML(key: string, opts?: Record<string, unknown>): string
  chipHTML(rarity: string): string
  freezeIfReduced(doc?: Document): void
}
interface LoomSymAPI {
  injectDefs(doc?: Document): void
  svgHTML(sym: string, size?: number): string
  freezeIfReduced(doc?: Document): void
  SYMS: string[]
}
interface LoomStkAPI {
  injectDefs(doc?: Document): void
  svgHTML(id: string, size?: number): string
  LOOMI: string[]
  STAR: string[]
}

declare global {
  interface Window {
    LoomGifts: LoomGiftsAPI
    LoomSym: LoomSymAPI
    LoomStk: LoomStkAPI
  }
}

export {}
