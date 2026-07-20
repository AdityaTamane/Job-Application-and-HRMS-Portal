import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { KeyRound, Clock, Phone, MapPin, Radar, ShieldCheck, Siren } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { liveElapsed } from '@/lib/workSession'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader, EmptyState } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'
import { LiveMap } from '@/components/map/LiveMap'
import { formatDuration } from '@/lib/utils'

const TRACKABLE = ['accepted', 'verifying', 'en_route', 'in_progress']

export function LiveTrack() {
  const { user } = useAuth()
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const jobs = useLiveQuery(
    async () => (user ? db.jobs.where('customerId').equals(user.id).toArray() : []),
    [user?.id],
  )
  const sessions = useLiveQuery(() => db.workSessions.toArray(), [])
  const students = useLiveQuery(() => db.students.toArray(), [])

  const sessionByJob = useMemo(() => new Map((sessions ?? []).map((s) => [s.jobId, s])), [sessions])
  const studentMap = useMemo(() => new Map((students ?? []).map((s) => [s.id, s])), [students])

  if (!user) return <PageLoader />
  const tracked = (jobs ?? []).filter((j) => TRACKABLE.includes(j.status))

  return (
    <div>
      <PageHeader title="Live Track" subtitle="Follow your pro in real time and share your start code" />

      {tracked.length === 0 ? (
        <EmptyState
          icon={<Radar className="h-7 w-7" />}
          title="Nothing to track right now"
          description="When a pro is on the way or working, you'll see their live location and status here."
          action={<Link to="/customer"><Button>Book a service</Button></Link>}
        />
      ) : (
        <div className="space-y-6">
          {tracked.map((job) => {
            const session = sessionByJob.get(job.id)
            const student = job.studentId ? studentMap.get(job.studentId) : undefined
            const last = session?.locationTrail[session.locationTrail.length - 1]
            const studentPos = last ? { lat: last.lat, lng: last.lng } : student ? { lat: student.lat, lng: student.lng } : null
            const elapsed = session ? liveElapsed(session) : 0
            return (
              <div key={job.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    {student && <Avatar src={student.photoUrl} name={student.name} size={44} />}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{job.title}</h3>
                        <StatusPill status={job.status} />
                      </div>
                      {student && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                          {student.name}
                          {student.badgeTier !== 'none' && <VerifiedBadge tier={student.badgeTier} showLabel={false} size="sm" />}
                          <a href={`tel:${student.phone}`} className="ml-1 inline-flex items-center gap-1 text-brand-600 hover:underline">
                            <Phone className="h-3.5 w-3.5" /> Call
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  {job.status === 'in_progress' && (
                    <div className="flex items-center gap-2 rounded-xl bg-brand-900 px-4 py-2 text-white">
                      <Clock className="h-4 w-4 text-beacon-400" />
                      <span className="font-mono text-lg font-bold tabular-nums">{formatDuration(elapsed)}</span>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 p-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <LiveMap
                      job={{ lat: job.lat, lng: job.lng }}
                      jobLabel={job.address}
                      student={studentPos}
                      studentLabel={student?.name}
                      trail={session?.locationTrail}
                      height={320}
                    />
                  </div>

                  <div className="space-y-3">
                    {/* OTP share card */}
                    {session?.otp && !session.otpVerified && (
                      <div className="rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
                          <KeyRound className="h-4 w-4" /> Start code
                        </div>
                        <p className="mt-2 font-mono text-3xl font-extrabold tracking-[0.3em] text-brand-800">{session.otp}</p>
                        <p className="mt-2 text-xs text-brand-600">Share this with your pro when they arrive to start the job.</p>
                      </div>
                    )}
                    {session?.otpVerified && job.status === 'in_progress' && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                        <ShieldCheck className="h-5 w-5" /> Pro verified in & working
                      </div>
                    )}
                    {session?.sosTriggered && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                        <Siren className="h-5 w-5" /> Safety alert active — team notified
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-100 p-3 text-sm">
                      <p className="flex items-center gap-2 text-slate-600"><MapPin className="h-4 w-4 text-beacon-500" /> {job.address || job.neighbourhood}</p>
                    </div>

                    {/* verify-in selfie — customer can confirm who showed up */}
                    {session?.selfieDataUrl && (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                        <img src={session.selfieDataUrl} alt="Pro verify-in selfie" className="h-14 w-14 rounded-lg object-cover ring-2 ring-emerald-200" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">Verified in with a live selfie</p>
                          <p className="text-xs text-slate-500">Confirm this matches the person at your door.</p>
                        </div>
                      </div>
                    )}

                    {/* verification status chips */}
                    {session && (
                      <div className="space-y-1.5 rounded-xl border border-slate-100 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Verification</p>
                        <Chip ok={session.selfieVerified} label="Selfie captured" />
                        <Chip ok={session.micGranted} label="Mic access" />
                        <Chip ok={session.otpVerified} label="OTP confirmed" />
                        <Chip ok={session.geofenceOk} label="On-site location" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Chip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      <span className={ok ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
    </div>
  )
}
