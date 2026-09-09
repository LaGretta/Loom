/**
 * Minimal QR Code encoder — byte mode, error-correction level M, versions 1–10
 * (up to 213 bytes, plenty for an invite URL). Self-contained on purpose: the app
 * ships six runtime dependencies and a QR generator isn't worth a seventh.
 */

type Group = [blocks: number, dataCodewords: number]

/** Per version at EC level M: EC codewords per block, and the block layout. */
const EC_BLOCKS: Record<number, { ec: number; groups: Group[] }> = {
  1: { ec: 10, groups: [[1, 16]] },
  2: { ec: 16, groups: [[1, 28]] },
  3: { ec: 26, groups: [[1, 44]] },
  4: { ec: 18, groups: [[2, 32]] },
  5: { ec: 24, groups: [[2, 43]] },
  6: { ec: 16, groups: [[4, 27]] },
  7: { ec: 18, groups: [[4, 31]] },
  8: { ec: 22, groups: [[2, 38], [2, 39]] },
  9: { ec: 22, groups: [[3, 36], [2, 37]] },
  10: { ec: 26, groups: [[4, 43], [1, 44]] },
}

/** Alignment-pattern centre coordinates per version. */
const ALIGN: Record<number, number[]> = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
}

/** 18-bit BCH version information, versions 7+. */
const VERSION_INFO: Record<number, number> = {
  7: 0x07c94, 8: 0x085bc, 9: 0x09a99, 10: 0x0a4d3,
}

/* ---------------- GF(256), primitive polynomial 0x11D ---------------- */
const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}
const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]])

function generatorPoly(degree: number): number[] {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0)
    for (let a = 0; a < poly.length; a++) {
      next[a] ^= mul(poly[a], 1)
      next[a + 1] ^= mul(poly[a], EXP[i])
    }
    poly = next
  }
  return poly
}

function reedSolomon(data: number[], ecLen: number): number[] {
  const gen = generatorPoly(ecLen)
  const res = new Array(data.length + ecLen).fill(0)
  for (let i = 0; i < data.length; i++) res[i] = data[i]
  for (let i = 0; i < data.length; i++) {
    const coef = res[i]
    if (!coef) continue
    for (let j = 0; j < gen.length; j++) res[i + j] ^= mul(gen[j], coef)
  }
  return res.slice(data.length)
}

/* ---------------- data encoding ---------------- */

const dataCapacity = (v: number) => EC_BLOCKS[v].groups.reduce((s, [c, l]) => s + c * l, 0)
/** Bytes that fit in byte mode at this version (minus mode + length header). */
const byteCapacity = (v: number) => dataCapacity(v) - (v >= 10 ? 3 : 2)

function pickVersion(len: number): number {
  for (let v = 1; v <= 10; v++) if (byteCapacity(v) >= len) return v
  throw new Error('QR: payload too long')
}

function encodeData(bytes: number[], version: number): number[] {
  const bits: number[] = []
  const push = (value: number, n: number) => { for (let i = n - 1; i >= 0; i--) bits.push((value >> i) & 1) }

  push(0b0100, 4)                                  // byte mode
  push(bytes.length, version >= 10 ? 16 : 8)
  for (const b of bytes) push(b, 8)

  const cap = dataCapacity(version) * 8
  push(0, Math.min(4, cap - bits.length))          // terminator
  while (bits.length % 8) bits.push(0)
  const pad = [0xec, 0x11]
  for (let i = 0; bits.length < cap; i++) push(pad[i % 2], 8)

  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0
    for (let k = 0; k < 8; k++) v = (v << 1) | bits[i + k]
    codewords.push(v)
  }
  return codewords
}

/** Split into blocks, add EC, then interleave both as the spec requires. */
function interleave(data: number[], version: number): number[] {
  const { ec, groups } = EC_BLOCKS[version]
  const blocks: number[][] = []
  const eccs: number[][] = []
  let p = 0
  for (const [count, len] of groups) {
    for (let i = 0; i < count; i++) {
      const block = data.slice(p, p + len)
      p += len
      blocks.push(block)
      eccs.push(reedSolomon(block, ec))
    }
  }
  const out: number[] = []
  const longest = Math.max(...blocks.map((b) => b.length))
  for (let i = 0; i < longest; i++) for (const b of blocks) if (i < b.length) out.push(b[i])
  for (let i = 0; i < ec; i++) for (const e of eccs) out.push(e[i])
  return out
}

/* ---------------- matrix ---------------- */

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

/** 15-bit BCH format information; ec is the level's 2-bit code (M = 0b00). */
function formatBits(ec: number, mask: number): number {
  const data = (ec << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ (((rem >> 9) & 1) * 0x537)
  return (((data << 10) | rem) ^ 0x5412) & 0x7fff
}

function penalty(m: boolean[][]): number {
  const n = m.length
  let score = 0

  // rule 1 — runs of five or more same-coloured modules
  for (let i = 0; i < n; i++) {
    for (const row of [true, false]) {
      let run = 1
      for (let j = 1; j < n; j++) {
        const a = row ? m[i][j] : m[j][i]
        const b = row ? m[i][j - 1] : m[j - 1][i]
        if (a === b) { run++; if (run === 5) score += 3; else if (run > 5) score++ }
        else run = 1
      }
    }
  }
  // rule 2 — 2x2 blocks of one colour
  for (let i = 0; i < n - 1; i++)
    for (let j = 0; j < n - 1; j++)
      if (m[i][j] === m[i][j + 1] && m[i][j] === m[i + 1][j] && m[i][j] === m[i + 1][j + 1]) score += 3

  // rule 3 — finder-like 1:1:3:1:1 patterns with four light modules beside them
  const A = [true, false, true, true, true, false, true, false, false, false, false]
  const B = [false, false, false, false, true, false, true, true, true, false, true]
  const match = (get: (k: number) => boolean, start: number, pat: boolean[]) => {
    for (let k = 0; k < pat.length; k++) if (get(start + k) !== pat[k]) return false
    return true
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j + 11 <= n; j++) {
      const row = (k: number) => m[i][k]
      const col = (k: number) => m[k][i]
      if (match(row, j, A) || match(row, j, B)) score += 40
      if (match(col, j, A) || match(col, j, B)) score += 40
    }
  }
  // rule 4 — deviation from a 50/50 dark ratio
  let dark = 0
  for (const row of m) for (const v of row) if (v) dark++
  const pct = (dark * 100) / (n * n)
  score += Math.floor(Math.abs(pct - 50) / 5) * 10
  return score
}

/** Returns the QR modules: `true` = dark. No quiet zone — the renderer adds it. */
export function qrMatrix(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text))
  const version = pickVersion(bytes.length)
  const size = 17 + version * 4
  const codewords = interleave(encodeData(bytes, version), version)

  const m: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
  const fixed: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
  const set = (r: number, c: number, v: boolean) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return
    m[r][c] = v
    fixed[r][c] = true
  }

  // finder patterns + separators
  for (const [r0, c0] of [[0, 0], [0, size - 7], [size - 7, 0]] as const) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const ring = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6)
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4
        set(r0 + r, c0 + c, ring || core)
      }
    }
  }
  // timing patterns
  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0) }

  // alignment patterns (skipped where they'd collide with a finder)
  const centres = ALIGN[version]
  for (const r of centres) {
    for (const c of centres) {
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++)
          set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1)
    }
  }
  set(size - 8, 8, true)                              // dark module

  // reserve the format-information strips
  for (let i = 0; i <= 8; i++) {
    if (!fixed[8][i]) set(8, i, false)
    if (!fixed[i][8]) set(i, 8, false)
  }
  for (let i = 0; i < 8; i++) {
    if (!fixed[8][size - 1 - i]) set(8, size - 1 - i, false)
    if (!fixed[size - 1 - i][8]) set(size - 1 - i, 8, false)
  }
  // version information (versions 7+)
  if (version >= 7) {
    const info = VERSION_INFO[version]
    for (let i = 0; i < 18; i++) {
      const bit = ((info >> i) & 1) === 1
      const r = Math.floor(i / 3)
      const c = i % 3
      set(size - 11 + c, r, bit)
      set(r, size - 11 + c, bit)
    }
  }

  // data placement: two-module columns, right to left, snaking up then down
  let bit = 0
  const total = codewords.length * 8
  const nextBit = () => {
    if (bit >= total) return false
    const v = ((codewords[bit >> 3] >> (7 - (bit & 7))) & 1) === 1
    bit++
    return v
  }
  let upward = true
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5                            // the vertical timing column is skipped
    for (let k = 0; k < size; k++) {
      const r = upward ? size - 1 - k : k
      for (const c of [col, col - 1]) if (!fixed[r][c]) m[r][c] = nextBit()
    }
    upward = !upward
  }

  // pick the mask with the lowest penalty
  let best: boolean[][] | null = null
  let bestScore = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const cand = m.map((row, r) => row.map((v, c) => (fixed[r][c] ? v : v !== MASKS[mask](r, c))))
    const fmt = formatBits(0b00, mask)                // level M
    // Both copies run most-significant bit first: position k carries bit 14 - k.
    for (let k = 0; k < 15; k++) {
      const b = ((fmt >> (14 - k)) & 1) === 1
      // copy 1: (8,0)…(8,5), (8,7), (8,8), (7,8), then (5,8)…(0,8)
      if (k < 6) cand[8][k] = b
      else if (k === 6) cand[8][7] = b
      else if (k === 7) cand[8][8] = b
      else if (k === 8) cand[7][8] = b
      else cand[14 - k][8] = b
      // copy 2: seven modules up column 8, then eight along row 8 — the module at
      // (size-8, 8) is the dark module, not a format bit.
      if (k < 7) cand[size - 1 - k][8] = b
      else cand[8][size - 15 + k] = b
    }
    cand[size - 8][8] = true
    const score = penalty(cand)
    if (score < bestScore) { bestScore = score; best = cand }
  }
  return best!
}
