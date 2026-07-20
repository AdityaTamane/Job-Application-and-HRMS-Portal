import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { KeyRound, Check, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast'

export function OtpVerify({ expected, onVerified }: { expected: string; onVerified: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const [error, setError] = useState(false)

  const setDigit = (i: number, v: string) => {
    const val = v.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = val
    setDigits(next)
    setError(false)
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const onPaste = (e: ChangeEvent<HTMLInputElement> | React.ClipboardEvent) => {
    const text = (e as React.ClipboardEvent).clipboardData?.getData('text') ?? ''
    const nums = text.replace(/\D/g, '').slice(0, 6).split('')
    if (nums.length) {
      const next = Array(6).fill('')
      nums.forEach((n, idx) => (next[idx] = n))
      setDigits(next)
      refs.current[Math.min(nums.length, 5)]?.focus()
    }
  }

  const verify = () => {
    if (digits.join('') === expected) {
      onVerified()
    } else {
      setError(true)
      toast.error('Incorrect OTP', 'Please check the code and try again.')
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <KeyRound className="h-7 w-7" />
      </div>
      <p className="mt-4 max-w-xs text-sm text-slate-600">
        Ask the customer for the 6-digit code shown on their tracking screen, then enter it below.
      </p>

      <div className="mt-5 flex gap-2" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el }}
            value={d}
            inputMode="numeric"
            maxLength={1}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            className={`h-12 w-11 rounded-xl border text-center text-xl font-bold outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${
              error ? 'border-red-400 bg-red-50' : 'border-slate-300'
            }`}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-500">
        <Info className="h-3.5 w-3.5" /> Demo code (shown on customer screen): <span className="font-mono font-semibold text-slate-700">{expected}</span>
      </div>

      <Button className="mt-5 w-full max-w-xs" disabled={digits.some((d) => !d)} icon={<Check className="h-4 w-4" />} onClick={verify}>
        Verify code
      </Button>
    </div>
  )
}
