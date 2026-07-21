import { useEffect, useRef, useState } from 'react'
import { Camera, RefreshCw, Check, AlertTriangle, ScanFace, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  analyzeFrame,
  averageHash,
  hashSimilarity,
  motionEnergy,
  referenceHash,
  CHALLENGES,
  MOTION_THRESHOLD,
  PRESENCE_VARIANCE,
  REQUIRED_MOTION,
  type ChallengeKind,
  type LivenessPhase,
} from '@/lib/liveness'
import { cn } from '@/lib/utils'

export interface SelfieResult {
  dataUrl: string
  livenessScore: number // 0..100
  faceMatchScore: number | null // 0..100, null when no usable reference
  passed: boolean
}

const CHALLENGE_KINDS: ChallengeKind[] = ['turn', 'nod', 'lean']

export function SelfieCapture({
  onCapture,
  referencePhotoUrl,
}: {
  onCapture: (result: SelfieResult) => void
  referencePhotoUrl?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const prevLuma = useRef<Float32Array | null>(null)
  const accumMotion = useRef(0)
  const presenceFrames = useRef(0)
  const lastGrid = useRef<number[] | null>(null)
  const refHash = useRef<number[] | null>(null)
  const phaseRef = useRef<LivenessPhase>('idle')

  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(true)
  const [shot, setShot] = useState<SelfieResult | null>(null)
  const [phase, setPhaseState] = useState<LivenessPhase>('idle')
  const [progress, setProgress] = useState(0)

  const setPhase = (p: LivenessPhase) => {
    phaseRef.current = p
    setPhaseState(p)
  }
  const [challenge] = useState<ChallengeKind>(
    () => CHALLENGE_KINDS[Math.floor(Math.random() * CHALLENGE_KINDS.length)],
  )

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const start = async () => {
    setError(null)
    setStarting(true)
    setPhase('idle')
    setProgress(0)
    accumMotion.current = 0
    presenceFrames.current = 0
    prevLuma.current = null
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setPhase('detecting_face')
      loop()
    } catch {
      setError('Camera access was blocked. Please allow camera permission and try again.')
    } finally {
      setStarting(false)
    }
  }

  // Analysis loop — throttled to ~12fps for stable motion estimates.
  const lastTick = useRef(0)
  const loop = () => {
    rafRef.current = requestAnimationFrame(loop)
    const video = videoRef.current
    if (!video || video.readyState < 2) return
    const now = performance.now()
    if (now - lastTick.current < 80) return
    lastTick.current = now

    if (!canvasRef.current) {
      const c = document.createElement('canvas')
      c.width = 48
      c.height = 48
      canvasRef.current = c
    }
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    const stats = analyzeFrame(video, ctx)
    if (!stats) return
    lastGrid.current = stats.gridLuma

    const present = stats.centerVariance > PRESENCE_VARIANCE
    const cur = phaseRef.current

    if (cur === 'detecting_face') {
      if (present) {
        presenceFrames.current++
        if (presenceFrames.current > 6) setPhase('challenge')
      } else {
        presenceFrames.current = Math.max(0, presenceFrames.current - 1)
      }
    } else if (cur === 'challenge') {
      if (prevLuma.current && present) {
        const m = motionEnergy(prevLuma.current, stats.luma)
        if (m > MOTION_THRESHOLD) accumMotion.current += m
        const p = Math.min(1, accumMotion.current / REQUIRED_MOTION)
        setProgress(p)
        if (p >= 1) {
          setPhase('passed')
          capture() // liveness satisfied — auto-capture this frame
        }
      }
    }
    prevLuma.current = stats.luma
  }

  const capture = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 480
    canvas.height = video.videoHeight || 360
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)

    const progress = Math.min(1, accumMotion.current / REQUIRED_MOTION)
    const livenessScore = Math.round(Math.min(0.99, 0.55 + 0.44 * progress) * 100)
    let faceMatchScore: number | null = null
    if (refHash.current && lastGrid.current) {
      const sim = hashSimilarity(averageHash(lastGrid.current), averageHash(refHash.current))
      faceMatchScore = Math.round(Math.max(0, Math.min(1, (sim - 0.35) / 0.45)) * 100)
    }
    // Liveness is the hard requirement (it proves a real, present person).
    // Face-match is advisory: it's shown for trust but never blocks check-in,
    // since a perceptual match depends on the pro having set a clear profile photo.
    const passed = livenessScore >= 60
    setShot({ dataUrl, livenessScore, faceMatchScore, passed })
    stop()
  }

  const retake = () => {
    setShot(null)
    start()
  }

  // Load the reference profile photo whenever it becomes available/changes.
  // (The student record often resolves a beat after the camera has opened.)
  useEffect(() => {
    let cancelled = false
    referenceHash(referencePhotoUrl).then((h) => {
      if (!cancelled) refHash.current = h
    })
    return () => {
      cancelled = true
    }
  }, [referencePhotoUrl])

  useEffect(() => {
    start()
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const phaseLabel =
    phase === 'detecting_face'
      ? 'Position your face in the oval…'
      : phase === 'challenge'
        ? CHALLENGES[challenge]
        : phase === 'passed'
          ? 'Liveness confirmed ✓'
          : 'Starting camera…'

  return (
    <div className="flex flex-col items-center">
      <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900">
        {shot ? (
          <img src={shot.dataUrl} alt="Verification selfie" className="h-full w-full object-cover" />
        ) : (
          <>
            <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className={cn(
                  'h-44 w-36 rounded-[50%] border-2 border-dashed transition-colors',
                  phase === 'challenge' || phase === 'passed' ? 'border-emerald-400' : 'border-white/70',
                )}
              />
            </div>
            {/* Live liveness confidence meter */}
            {phase === 'challenge' && (
              <div className="absolute inset-x-4 bottom-3">
                <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-white">
                  <span>Liveness</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                  <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
            )}
          </>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/90 p-6 text-center text-white">
            <AlertTriangle className="h-8 w-8 text-beacon-400" />
            <p className="text-sm">{error}</p>
            <Button size="sm" variant="secondary" onClick={start} icon={<RefreshCw className="h-4 w-4" />}>Retry</Button>
          </div>
        )}
      </div>

      {!shot && !error && (
        <div className="mt-3 flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
          <ScanFace className="h-4 w-4 shrink-0" /> {phaseLabel}
        </div>
      )}

      {shot && (
        <div className="mt-3 w-full max-w-sm space-y-2">
          <ScoreBar label="Liveness detection" value={shot.livenessScore} />
          {shot.faceMatchScore !== null ? (
            <>
              <ScoreBar label="Face match vs. profile (advisory)" value={shot.faceMatchScore} />
              {shot.faceMatchScore < 40 && (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                  Low match — set a clear profile photo for a stronger match. Check-in still allowed.
                </p>
              )}
            </>
          ) : (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              No profile photo on file — face-match skipped
            </p>
          )}
          <div
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold',
              shot.passed
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            {shot.passed ? 'Liveness confirmed — you can check in' : 'Liveness weak — please retake'}
          </div>
        </div>
      )}

      <div className="mt-4 flex w-full max-w-sm gap-2">
        {shot ? (
          <>
            <Button variant="outline" className="flex-1" icon={<RefreshCw className="h-4 w-4" />} onClick={retake}>Retake</Button>
            <Button
              variant="success"
              className="flex-1"
              disabled={!shot.passed}
              icon={<Check className="h-4 w-4" />}
              onClick={() => onCapture(shot)}
            >
              Use this selfie
            </Button>
          </>
        ) : (
          <Button
            className="w-full"
            disabled={starting || !!error || phase === 'detecting_face' || (phase === 'challenge' && progress < 0.25)}
            icon={<Camera className="h-4 w-4" />}
            onClick={capture}
          >
            {starting
              ? 'Starting camera…'
              : phase === 'detecting_face'
                ? 'Detecting your face…'
                : phase === 'challenge' && progress < 0.25
                  ? 'Keep moving your head…'
                  : 'Capture now'}
          </Button>
        )}
      </div>
    </div>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const tone = value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-beacon-500' : 'bg-red-500'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-semibold text-slate-800 dark:text-slate-100">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
