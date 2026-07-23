import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { KeyRound, Clock, Phone, MapPin, Radar, ShieldCheck, Siren, UserCheck } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { liveElapsed, verifyDoorstep } from '@/lib/workSession'
import type { Student, WorkSession } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader, EmptyState } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'
import { LiveMap } from '@/components/map/LiveMap'
import { toast } from '@/components/ui/toast'
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
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 p-4">
                  <div className="flex items-center gap-3">
                    {student && <Avatar src={student.photoUrl} name={student.name} size={44} />}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{job.title}</h3>
                        <StatusPill status={job.status} />
                      </div>
                      {student && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
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
                      <div className="rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-4 text-center dark:border-brand-500/50 dark:bg-brand-500/10">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                          <KeyRound className="h-4 w-4" /> Start code
                        </div>
                        <p className="mt-2 font-mono text-3xl font-extrabold tracking-[0.3em] text-brand-800 dark:text-brand-100">{session.otp}</p>
                        <p className="mt-2 text-xs text-brand-600 dark:text-brand-300">Share this with your pro when they arrive to start the job.</p>
                      </div>
                    )}
                    {session?.otpVerified && job.status === 'in_progress' && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <ShieldCheck className="h-5 w-5" /> Pro verified in & working
                      </div>
                    )}

                    {/* Doorstep identity handshake */}
                    {session?.doorstepPin && <DoorstepVerify session={session} student={student} />}
                    {session?.sosTriggered && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
                        <Siren className="h-5 w-5" /> Safety alert active — team notified
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 text-sm">
                      <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><MapPin className="h-4 w-4 text-beacon-500" /> {job.address || job.neighbourhood}</p>
                    </div>

                    {/* verify-in selfie — customer can confirm who showed up */}
                    {session?.selfieDataUrl && (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                        <img src={session.selfieDataUrl} alt="Pro verify-in selfie" className="h-14 w-14 rounded-lg object-cover ring-2 ring-emerald-200" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Verified in with a live selfie</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">AI liveness check passed on the pro's device.</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {typeof session.livenessScore === 'number' && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                Liveness {session.livenessScore}%
                              </span>
                            )}
                            {typeof session.faceMatchScore === 'number' && (
                              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                                Face match {session.faceMatchScore}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* verification status chips */}
                    {session && (
                      <div className="space-y-1.5 rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Verification</p>
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

function DoorstepVerify({ session, student }: { session: WorkSession; student?: Student }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  if (session.doorstepVerifiedAt) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        <UserCheck className="h-5 w-5" /> Identity confirmed at your door
      </div>
    )
  }

  const photo = session.selfieDataUrl ?? student?.photoUrl
  const submit = async () => {
    const ok = await verifyDoorstep(session, pin)
    if (ok) toast.success('Identity confirmed', 'This is your verified pro.')
    else { setError(true); toast.error('Code does not match', 'Ask the pro to read their doorstep code again.') }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <UserCheck className="h-4 w-4 text-brand-600 dark:text-brand-300" /> Confirm who's at your door
      </div>
      <div className="mt-3 flex items-center gap-3">
        {photo
          ? <img src={photo} alt="Pro" className="h-14 w-14 rounded-xl object-cover ring-2 ring-brand-200 dark:ring-brand-500/30" />
          : <Avatar name={student?.name ?? 'Pro'} size={56} />}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{student?.name ?? 'Your pro'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Check the face matches, then enter their 4-digit code.</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(false) }}
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          className={`h-10 w-24 rounded-xl border text-center text-lg font-bold tracking-[0.4em] outline-none transition focus:ring-2 focus:ring-brand-100 dark:bg-slate-800 ${error ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`}
        />
        <Button className="flex-1" disabled={pin.length !== 4} onClick={submit}>Verify pro</Button>
      </div>
    </div>
  )
}

function Chip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      <span className={ok ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}>{label}</span>
    </div>
  )
}
