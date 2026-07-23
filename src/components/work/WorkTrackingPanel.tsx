import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Square, Siren, Clock, Radio, UserCheck } from 'lucide-react'
import type { Job, WorkSession } from '@/lib/types'
import { appendLocation, endWork, liveElapsed, pauseWork, resumeWork, triggerSos, jitterAround } from '@/lib/workSession'
import { LiveMap } from '@/components/map/LiveMap'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StatusPill } from '@/components/ui/Badge'
import { toast } from '@/components/ui/toast'
import { formatDuration } from '@/lib/utils'

export function WorkTrackingPanel({ session, job }: { session: WorkSession; job: Job }) {
  const [, forceTick] = useState(0)
  const [ending, setEnding] = useState(false)
  const [sosOpen, setSosOpen] = useState(false)
  const moveCounter = useRef(1)

  // 1s timer tick for the elapsed display
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // simulate live location updates while active
  useEffect(() => {
    if (session.status !== 'active') return
    const id = setInterval(() => {
      appendLocation(session, jitterAround(job.lat, job.lng, moveCounter.current++))
    }, 4000)
    return () => clearInterval(id)
  }, [session, job.lat, job.lng])

  const last = session.locationTrail[session.locationTrail.length - 1]
  const studentPos = last ? { lat: last.lat, lng: last.lng } : { lat: job.lat, lng: job.lng }
  const elapsed = liveElapsed(session)

  const doEnd = async () => {
    setEnding(true)
    await endWork(session, job)
    toast.success('Work completed!', 'The customer has been notified to rate you.')
    setEnding(false)
  }

  const doSos = async () => {
    await triggerSos(session, job)
    setSosOpen(false)
    toast.warning('SOS sent', 'Lighthouse safety team and the customer have been alerted.')
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 p-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{job.title}</h3>
            <StatusPill status={job.status} />
            {session.sosTriggered && <StatusPill status="rejected" />}
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{job.address || job.neighbourhood}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-brand-900 px-4 py-2 text-white">
          <Clock className="h-4 w-4 text-beacon-400" />
          <span className="font-mono text-lg font-bold tabular-nums">{formatDuration(elapsed)}</span>
        </div>
      </div>

      <div className="p-4">
        {session.doorstepPin && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs dark:border-slate-700">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <UserCheck className="h-3.5 w-3.5" /> Doorstep code {session.doorstepVerifiedAt ? '· confirmed ✓' : '(read to customer)'}
            </span>
            <span className="font-mono text-sm font-bold tracking-[0.3em] text-slate-800 dark:text-slate-100">{session.doorstepPin}</span>
          </div>
        )}
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-brand-600">
          <Radio className={`h-3.5 w-3.5 ${session.status === 'active' ? 'animate-pulse text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`} />
          {session.status === 'active' ? 'Live location sharing active' : 'Location sharing paused'}
        </div>
        <LiveMap
          job={{ lat: job.lat, lng: job.lng }}
          jobLabel={job.address}
          student={studentPos}
          studentLabel="You"
          trail={session.locationTrail}
          height={300}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {session.status === 'active' ? (
            <Button variant="outline" icon={<Pause className="h-4 w-4" />} onClick={() => pauseWork(session)}>Pause</Button>
          ) : (
            <Button variant="outline" icon={<Play className="h-4 w-4" />} onClick={() => resumeWork(session)}>Resume</Button>
          )}
          <Button variant="success" icon={<Square className="h-4 w-4" />} loading={ending} onClick={doEnd}>End work</Button>
          <Button variant="danger" className="ml-auto" icon={<Siren className="h-4 w-4" />} onClick={() => setSosOpen(true)}>SOS</Button>
        </div>
      </div>

      <Modal open={sosOpen} onClose={() => setSosOpen(false)} title="Raise an SOS?" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This immediately alerts the Lighthouse safety team and the customer with your live location. Use only in an
          emergency.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setSosOpen(false)}>Cancel</Button>
          <Button variant="danger" className="flex-1" icon={<Siren className="h-4 w-4" />} onClick={doSos}>Send SOS</Button>
        </div>
      </Modal>
    </div>
  )
}
