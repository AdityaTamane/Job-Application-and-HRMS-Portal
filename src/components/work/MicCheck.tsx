import { useEffect, useRef, useState } from 'react'
import { Mic, AlertTriangle, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function MicCheck({ onGranted }: { onGranted: () => void }) {
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [granted, setGranted] = useState(false)
  const [level, setLevel] = useState(0)
  const [starting, setStarting] = useState(true)

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close().catch(() => {})
    streamRef.current = null
    audioCtxRef.current = null
  }

  const start = async () => {
    setError(null)
    setStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      setGranted(true)
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((s, v) => s + v, 0) / data.length
        setLevel(Math.min(100, Math.round((avg / 128) * 100)))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      setError('Microphone access was blocked. Please allow mic permission and try again.')
    } finally {
      setStarting(false)
    }
  }

  useEffect(() => {
    start()
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const confirm = () => {
    cleanup()
    onGranted()
  }

  const bars = Array.from({ length: 16 })

  return (
    <div className="flex flex-col items-center text-center">
      <div className={`flex h-24 w-24 items-center justify-center rounded-full ${granted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
        <Mic className="h-10 w-10" />
      </div>

      {error ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-beacon-500" />
          <p className="max-w-xs text-sm text-slate-600 dark:text-slate-300">{error}</p>
          <Button size="sm" variant="outline" icon={<RefreshCw className="h-4 w-4" />} onClick={start}>Retry</Button>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            {granted ? 'Microphone active — say something to test the level.' : 'Requesting microphone access…'}
          </p>
          <div className="mt-4 flex h-10 items-end gap-1">
            {bars.map((_, i) => {
              const active = level > (i / bars.length) * 100
              return (
                <span
                  key={i}
                  className={`w-2 rounded-full transition-all ${active ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  style={{ height: `${8 + (i / bars.length) * 32}px`, opacity: active ? 1 : 0.5 }}
                />
              )
            })}
          </div>
          <Button className="mt-5 w-full max-w-xs" disabled={!granted || starting} icon={<Check className="h-4 w-4" />} onClick={confirm}>
            Confirm mic access
          </Button>
        </>
      )}
    </div>
  )
}
