import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { CalendarClock, MapPin, ShieldCheck, PlayCircle, Radar, UserCheck } from 'lucide-react'
import { db } from '@/lib/db'
import { getOrCreateSession } from '@/lib/workSession'
import { useStudent } from '@/hooks/useStudent'
import type { Job, WorkSession } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader, EmptyState } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'
import { WorkSessionGate } from '@/components/work/WorkSessionGate'
import { WorkTrackingPanel } from '@/components/work/WorkTrackingPanel'
import { ChatButton } from '@/components/chat/ChatButton'
import { formatDateTime } from '@/lib/utils'

const READY = ['accepted', 'verifying']

export function ActiveWork() {
  const student = useStudent()
  const jobs = useLiveQuery(
    async () => (student ? db.jobs.where('studentId').equals(student.id).toArray() : []),
    [student?.id],
  )
  const sessions = useLiveQuery(() => db.workSessions.toArray(), [])
  const sessionByJob = useMemo(() => new Map((sessions ?? []).map((s) => [s.jobId, s])), [sessions])

  const [gate, setGate] = useState<{ job: Job; session: WorkSession } | null>(null)

  if (!student) return <PageLoader />

  const active = (jobs ?? []).filter((j) => j.status === 'in_progress')
  const ready = (jobs ?? []).filter((j) => READY.includes(j.status))

  const startGate = async (job: Job) => {
    const session = await getOrCreateSession(job, student)
    setGate({ job, session })
  }

  return (
    <div>
      <PageHeader title="Active Work" subtitle="Verify in and track your live jobs safely" />

      {active.length === 0 && ready.length === 0 && (
        <EmptyState
          icon={<Radar className="h-7 w-7" />}
          title="No jobs to track"
          description="Accept a job request, then start it here with our safety verification flow."
          action={<Link to="/student/jobs"><Button>Find jobs</Button></Link>}
        />
      )}

      {/* In-progress tracking */}
      {active.map((job) => {
        const session = sessionByJob.get(job.id)
        if (!session) return null
        return <div key={job.id} className="mb-6"><WorkTrackingPanel session={session} job={job} /></div>
      })}

      {/* Ready to start */}
      {ready.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ready to start ({ready.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ready.map((job) => {
              const jobSession = sessionByJob.get(job.id)
              return (
              <div key={job.id} className="card p-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{job.title}</h3>
                  <StatusPill status={job.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {formatDateTime(job.scheduledAt)}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.address || job.neighbourhood}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
                  <ShieldCheck className="h-4 w-4" /> Requires selfie, mic, OTP & location check to start
                </div>
                {jobSession?.doorstepPin && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs dark:border-slate-700">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <UserCheck className="h-3.5 w-3.5" /> Doorstep code {jobSession.doorstepVerifiedAt ? '· confirmed ✓' : '(read to customer)'}
                    </span>
                    <span className="font-mono text-sm font-bold tracking-[0.3em] text-slate-800 dark:text-slate-100">{jobSession.doorstepPin}</span>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button className="flex-1" icon={<PlayCircle className="h-4 w-4" />} onClick={() => startGate(job)}>
                    Start work
                  </Button>
                  <ChatButton job={job} size="md" label="Customer" />
                </div>
              </div>
            )})}
          </div>
        </section>
      )}

      {gate && (
        <WorkSessionGate
          job={gate.job}
          session={gate.session}
          open={!!gate}
          onClose={() => setGate(null)}
          onStarted={() => setGate(null)}
        />
      )}
    </div>
  )
}
