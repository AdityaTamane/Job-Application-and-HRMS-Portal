import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ScanFace, Mic, KeyRound, MapPin, Check } from 'lucide-react'
import type { GeoPoint, Job, WorkSession } from '@/lib/types'
import { db } from '@/lib/db'
import { updateSession, startWork } from '@/lib/workSession'
import { Modal } from '@/components/ui/Modal'
import { SelfieCapture } from './SelfieCapture'
import { MicCheck } from './MicCheck'
import { OtpVerify } from './OtpVerify'
import { GeofenceCheck } from './GeofenceCheck'
import { cn } from '@/lib/utils'

const STEPS = [
  { key: 'selfie', label: 'Selfie', icon: ScanFace },
  { key: 'mic', label: 'Mic', icon: Mic },
  { key: 'otp', label: 'OTP', icon: KeyRound },
  { key: 'geo', label: 'Location', icon: MapPin },
]

export function WorkSessionGate({
  job,
  session,
  open,
  onClose,
  onStarted,
}: {
  job: Job
  session: WorkSession
  open: boolean
  onClose: () => void
  onStarted: () => void
}) {
  const [step, setStep] = useState(0)
  const [starting, setStarting] = useState(false)
  const student = useLiveQuery(() => db.students.get(session.studentId), [session.studentId])

  const finish = async (point: GeoPoint) => {
    setStarting(true)
    await updateSession(session.id, { geofenceOk: true })
    await startWork(session, job, point)
    setStarting(false)
    onStarted()
    onClose()
    setStep(0)
  }

  return (
    <Modal open={open} onClose={onClose} title="Verify before you start" size="md">
      {/* Stepper */}
      <div className="mb-6 flex items-center">
        {STEPS.map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={s.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition',
                    done && 'border-emerald-500 bg-emerald-500 text-white',
                    active && 'border-brand-500 bg-brand-50 text-brand-600',
                    !done && !active && 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-300',
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className={cn('text-[11px] font-medium', active ? 'text-brand-600' : 'text-slate-400 dark:text-slate-500')}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={cn('mx-1 h-0.5 flex-1', done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700')} />}
            </div>
          )
        })}
      </div>

      <div className="min-h-[300px]">
        {step === 0 && (
          <SelfieCapture
            referencePhotoUrl={student?.photoUrl}
            onCapture={async (r) => {
              await updateSession(session.id, {
                selfieDataUrl: r.dataUrl,
                selfieVerified: r.passed,
                livenessScore: r.livenessScore,
                faceMatchScore: r.faceMatchScore,
              })
              setStep(1)
            }}
          />
        )}
        {step === 1 && (
          <MicCheck
            onGranted={async () => {
              await updateSession(session.id, { micGranted: true })
              setStep(2)
            }}
          />
        )}
        {step === 2 && (
          <OtpVerify
            expected={session.otp ?? ''}
            onVerified={async () => {
              await updateSession(session.id, { otpVerified: true })
              setStep(3)
            }}
          />
        )}
        {step === 3 && (
          <div className={starting ? 'pointer-events-none opacity-60' : ''}>
            <GeofenceCheck job={{ lat: job.lat, lng: job.lng, address: job.address || job.neighbourhood }} onVerified={finish} />
          </div>
        )}
      </div>
    </Modal>
  )
}
