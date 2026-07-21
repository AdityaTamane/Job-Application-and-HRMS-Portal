import { useEffect, useRef, useState } from 'react'
import { Camera, RefreshCw, Check, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

/**
 * Simple camera capture for a still photo (e.g. a profile picture).
 * No liveness/ML — that lives in the work-session gate. This just snaps a shot.
 */
export function CameraCaptureModal({
  open,
  onClose,
  onCapture,
  title = 'Take a photo',
}: {
  open: boolean
  onClose: () => void
  onCapture: (dataUrl: string) => void
  title?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(true)
  const [shot, setShot] = useState<string | null>(null)

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
      setError('Camera access was blocked. Allow camera permission and try again.')
    } finally {
      setStarting(false)
    }
  }

  useEffect(() => {
    if (open) {
      setShot(null)
      start()
    }
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const capture = () => {
    const video = videoRef.current
    if (!video) return
    // Square crop centred on the frame — ideal for an avatar.
    const size = Math.min(video.videoWidth || 480, video.videoHeight || 360)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const sx = ((video.videoWidth || size) - size) / 2
    const sy = ((video.videoHeight || size) - size) / 2
    ctx.translate(size, 0)
    ctx.scale(-1, 1) // mirror to match the preview
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size)
    setShot(canvas.toDataURL('image/jpeg', 0.8))
    stop()
  }

  const retake = () => {
    setShot(null)
    start()
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center">
        <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-slate-900">
          {shot ? (
            <img src={shot} alt="Captured" className="h-full w-full object-cover" />
          ) : (
            <>
              <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 rounded-full border-2 border-dashed border-white/60" />
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

        <div className="mt-4 flex w-full max-w-xs gap-2">
          {shot ? (
            <>
              <Button variant="outline" className="flex-1" icon={<RefreshCw className="h-4 w-4" />} onClick={retake}>
                Retake
              </Button>
              <Button
                variant="success"
                className="flex-1"
                icon={<Check className="h-4 w-4" />}
                onClick={() => {
                  onCapture(shot)
                  onClose()
                }}
              >
                Use photo
              </Button>
            </>
          ) : (
            <Button className="w-full" disabled={starting || !!error} icon={<Camera className="h-4 w-4" />} onClick={capture}>
              {starting ? 'Starting camera…' : 'Capture'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
