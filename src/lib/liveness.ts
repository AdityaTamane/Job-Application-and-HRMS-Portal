// ---------------------------------------------------------------------------
// On-device identity verification (feature #1).
// Real in-browser computer vision — no server, no API keys, no model download.
// Two signals are computed directly from webcam pixels via <canvas>:
//   1. Liveness: an active motion challenge-response that a static photo fails.
//   2. Face-match: perceptual-hash (aHash) similarity between the captured
//      selfie and the student's reference photo.
// ---------------------------------------------------------------------------

export const HASH_SIZE = 8 // 8x8 average-hash → 64 bits

export interface FrameStats {
  luma: Float32Array // downsampled grayscale, length HASH_SIZE*HASH_SIZE-independent
  gridLuma: number[] // HASH_SIZE*HASH_SIZE mean grid (for aHash)
  brightness: number // 0..255 mean
  centerVariance: number // variance in the central face region (presence signal)
}

const WORK = { w: 48, h: 48 } // analysis resolution — cheap and enough for motion/hash

/** Draw the current video frame to an offscreen canvas and extract stats. */
export function analyzeFrame(
  video: HTMLVideoElement,
  ctx: CanvasRenderingContext2D,
): FrameStats | null {
  const { w, h } = WORK
  try {
    ctx.drawImage(video, 0, 0, w, h)
  } catch {
    return null
  }
  const { data } = ctx.getImageData(0, 0, w, h)
  const luma = new Float32Array(w * h)
  let sum = 0
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    luma[p] = y
    sum += y
  }
  const brightness = sum / (w * h)

  // Central-region variance → is a face-ish subject present & lit?
  let cSum = 0
  let cSum2 = 0
  let cN = 0
  const x0 = Math.floor(w * 0.3)
  const x1 = Math.floor(w * 0.7)
  const y0 = Math.floor(h * 0.2)
  const y1 = Math.floor(h * 0.8)
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const v = luma[y * w + x]
      cSum += v
      cSum2 += v * v
      cN++
    }
  }
  const cMean = cSum / cN
  const centerVariance = cSum2 / cN - cMean * cMean

  // Coarse grid means for the perceptual hash.
  const gridLuma: number[] = []
  const cellW = w / HASH_SIZE
  const cellH = h / HASH_SIZE
  for (let gy = 0; gy < HASH_SIZE; gy++) {
    for (let gx = 0; gx < HASH_SIZE; gx++) {
      let s = 0
      let n = 0
      for (let y = Math.floor(gy * cellH); y < Math.floor((gy + 1) * cellH); y++) {
        for (let x = Math.floor(gx * cellW); x < Math.floor((gx + 1) * cellW); x++) {
          s += luma[y * w + x]
          n++
        }
      }
      gridLuma.push(n ? s / n : 0)
    }
  }

  return { luma, gridLuma, brightness, centerVariance }
}

/** Mean absolute luma difference between two frames, normalized 0..1. */
export function motionEnergy(a: Float32Array, b: Float32Array): number {
  let diff = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) diff += Math.abs(a[i] - b[i])
  return diff / n / 255
}

/** Average-hash (aHash): 1 where a cell is brighter than the grid mean. */
export function averageHash(gridLuma: number[]): number[] {
  const mean = gridLuma.reduce((s, v) => s + v, 0) / gridLuma.length
  return gridLuma.map((v) => (v >= mean ? 1 : 0))
}

/** Similarity of two aHashes: 1 - normalized hamming distance. */
export function hashSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (!n) return 0
  let same = 0
  for (let i = 0; i < n; i++) if (a[i] === b[i]) same++
  return same / n
}

/** True when a reference image is effectively blank/uniform (no usable face). */
export function isBlankHash(gridLuma: number[]): boolean {
  const mean = gridLuma.reduce((s, v) => s + v, 0) / gridLuma.length
  const variance = gridLuma.reduce((s, v) => s + (v - mean) ** 2, 0) / gridLuma.length
  return variance < 4
}

/** Compute the aHash of a still image (e.g. the reference profile photo). */
export function hashImage(img: HTMLImageElement): number[] | null {
  const canvas = document.createElement('canvas')
  canvas.width = WORK.w
  canvas.height = WORK.h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, WORK.w, WORK.h)
  const stats = statsFromCanvas(ctx)
  return stats.gridLuma
}

function statsFromCanvas(ctx: CanvasRenderingContext2D): { gridLuma: number[] } {
  const { w, h } = WORK
  const { data } = ctx.getImageData(0, 0, w, h)
  const luma = new Float32Array(w * h)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    luma[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  const gridLuma: number[] = []
  const cellW = w / HASH_SIZE
  const cellH = h / HASH_SIZE
  for (let gy = 0; gy < HASH_SIZE; gy++) {
    for (let gx = 0; gx < HASH_SIZE; gx++) {
      let s = 0
      let n = 0
      for (let y = Math.floor(gy * cellH); y < Math.floor((gy + 1) * cellH); y++) {
        for (let x = Math.floor(gx * cellW); x < Math.floor((gx + 1) * cellW); x++) {
          s += luma[y * w + x]
          n++
        }
      }
      gridLuma.push(n ? s / n : 0)
    }
  }
  return { gridLuma }
}

/** Load an image (data URL) and resolve its aHash, or null if unusable. */
export function referenceHash(dataUrl?: string): Promise<number[] | null> {
  return new Promise((resolve) => {
    if (!dataUrl) return resolve(null)
    const img = new Image()
    img.onload = () => {
      const h = hashImage(img)
      resolve(h && !isBlankHash(h) ? h : null)
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

// ---------------------------------------------------------------------------
// Liveness challenge state machine
// ---------------------------------------------------------------------------

export type ChallengeKind = 'turn' | 'nod' | 'lean'
export const CHALLENGES: Record<ChallengeKind, string> = {
  turn: 'Slowly turn your head left, then right',
  nod: 'Nod your head up and down',
  lean: 'Lean a little closer, then back',
}

export type LivenessPhase = 'idle' | 'detecting_face' | 'challenge' | 'passed' | 'failed'

/** Thresholds tuned for a typical laptop webcam. */
export const PRESENCE_VARIANCE = 90 // central region must have this much detail
export const MOTION_THRESHOLD = 0.012 // per-frame motion counts toward the challenge
export const REQUIRED_MOTION = 0.9 // accumulated motion score needed to pass
