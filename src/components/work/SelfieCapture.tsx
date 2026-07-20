import { useEffect, useRef, useState } from 'react'
import { Camera, RefreshCw, Check, AlertTriangle, ScanFace } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const LIVENESS_PROMPTS = ['Blink twice slowly', 'Turn your head slightly left', 'Smile for the camera', 'Look straight ahead']

export function SelfieCapture({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(true)
  const [shot, setShot] = useState<string | null>(null)
  // deterministic-ish prompt without Math.random at module load
  const prompt = LIVENESS_PROMPTS[new Date().getSeconds() % LIVENESS_PROMPTS.length]

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const start = async () => {
    setError(null)
    setStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setError('Camera access was blocked. Please allow camera permission and try again.')
    } finally {
      setStarting(false)
    }
  }

  useEffect(() => {
    start()
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const capture = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 480
    canvas.height = video.videoHeight || 360
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // mirror to match preview
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    setShot(dataUrl)
    stop()
  }

  const retake = () => {
    setShot(null)
    start()
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900">
        {shot ? (
          <img src={shot} alt="Selfie" className="h-full w-full object-cover" />
        ) : (
          <>
            <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
            {/* face guide */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-44 w-36 rounded-[50%] border-2 border-dashed border-white/70" />
            </div>
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
        <div className="mt-3 flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
          <ScanFace className="h-4 w-4" /> Liveness check: <span className="text-brand-900">{prompt}</span>
        </div>
      )}

      <div className="mt-4 flex w-full max-w-sm gap-2">
        {shot ? (
          <>
            <Button variant="outline" className="flex-1" icon={<RefreshCw className="h-4 w-4" />} onClick={retake}>Retake</Button>
            <Button variant="success" className="flex-1" icon={<Check className="h-4 w-4" />} onClick={() => onCapture(shot)}>Use this selfie</Button>
          </>
        ) : (
          <Button className="w-full" disabled={starting || !!error} icon={<Camera className="h-4 w-4" />} onClick={capture}>
            {starting ? 'Starting camera…' : 'Capture selfie'}
          </Button>
        )}
      </div>
    </div>
  )
}
