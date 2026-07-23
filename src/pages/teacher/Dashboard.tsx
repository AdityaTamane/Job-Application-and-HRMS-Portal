import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowRight, GraduationCap, FileText, CalendarOff, User, PartyPopper,
  Video, MapPin, Star, Clock, Banknote, Building2, CalendarDays, BadgeIndianRupee,
} from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { useTeacherStatus } from '@/hooks/useTeacherStatus'
import { STAGES } from '@/lib/ats'
import type { Employee, TeacherApplicant } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader } from '@/components/ui/misc'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusPill, Badge } from '@/components/ui/Badge'
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

export function TeacherDashboard() {
  const { user } = useAuth()
  const status = useTeacherStatus()

  if (!user || status === undefined) return <PageLoader />

  return status.hired && status.employee
    ? <FacultyDashboard name={user.name} employee={status.employee} userId={user.id} />
    : <CandidateDashboard name={user.name} applicant={status.applicant} />
}

/* ------------------------------- Candidate ------------------------------- */

const CANDIDATE_QUICK = [
  { to: '/teacher/openings', label: 'Browse openings', desc: 'Subjects we hire for', icon: GraduationCap },
  { to: '/teacher/application', label: 'Track application', desc: 'Your hiring progress', icon: FileText },
  { to: '/teacher/profile', label: 'My profile', desc: 'Edit your details', icon: User },
]

function CandidateDashboard({ name, applicant }: { name: string; applicant?: TeacherApplicant }) {
  const currentIdx = applicant ? STAGES.findIndex((s) => s.stage === applicant.stage) : -1
  const rejected = applicant?.stage === 'rejected'
  const nextInterview = applicant?.interviews
    .filter((iv) => !iv.result || iv.result === 'pending')
    .sort((a, b) => a.scheduledAt - b.scheduledAt)[0]

  return (
    <div>
      <PageHeader
        title={`Welcome, ${name.split(' ')[0]} 👋`}
        subtitle={rejected ? 'This application is closed — you\'re welcome to apply again anytime' : 'Track your application journey with Lighthouse'}
        actions={applicant && <StatusPill status={applicant.stage} />}
      />

      {applicant && !rejected && (
        <Card className="mb-6">
          <CardBody>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Application for</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{applicant.subject}</p>
              </div>
              <Link to="/teacher/application"><Button variant="outline" icon={<ArrowRight className="h-4 w-4" />}>View details</Button></Link>
            </div>
            <div className="flex items-center">
              {STAGES.map((s, i) => {
                const done = i < currentIdx
                const active = i === currentIdx
                return (
                  <div key={s.stage} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition',
                        done && 'border-emerald-500 bg-emerald-500 text-white',
                        active && 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15',
                        !done && !active && 'border-slate-200 bg-white text-slate-300 dark:border-slate-800 dark:bg-slate-900',
                      )}>
                        {i + 1}
                      </div>
                      <span className={cn('text-[11px] font-medium', active ? 'text-brand-600 dark:text-brand-300' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500')}>{s.label}</span>
                    </div>
                    {i < STAGES.length - 1 && <div className={cn('mx-1 h-0.5 flex-1', done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700')} />}
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Next interview</p>
            {nextInterview ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  {nextInterview.mode === 'online' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatDateTime(nextInterview.scheduledAt)}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">with {nextInterview.interviewer}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">None scheduled yet</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Recruiter rating</p>
            <p className="mt-2 flex items-center gap-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">
              <Star className="h-5 w-5 fill-beacon-400 text-beacon-400" />
              {applicant?.rating ? applicant.rating.toFixed(1) : '—'}
            </p>
          </CardBody>
        </Card>
      </div>

      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Quick actions</h3>
      <QuickGrid items={CANDIDATE_QUICK} />
    </div>
  )
}

/* -------------------------------- Faculty -------------------------------- */

const FACULTY_QUICK = [
  { to: '/teacher/timeoff', label: 'Time off', desc: 'Apply for leave', icon: CalendarOff },
  { to: '/teacher/payslips', label: 'Payslips', desc: 'Your salary history', icon: Banknote },
  { to: '/teacher/profile', label: 'My profile', desc: 'Edit your details', icon: User },
  { to: '/teacher/application', label: 'Hiring history', desc: 'How you joined', icon: FileText },
]

function FacultyDashboard({ name, employee, userId }: { name: string; employee: Employee; userId: string }) {
  const payslips = useLiveQuery(() => db.payroll.where('employeeId').equals(employee.id).toArray(), [employee.id])
  const requests = useLiveQuery(() => db.workforceRequests.where('applicantId').equals(userId).toArray(), [userId])

  const latest = (payslips ?? []).slice().sort((a, b) => b.month.localeCompare(a.month))[0]
  const pendingTimeOff = (requests ?? []).filter((r) => r.status === 'pending').length

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${name.split(' ')[0]} 👋`}
        subtitle={`${employee.designation} · ${employee.department} · since ${formatDate(employee.joinDate)}`}
        actions={<Badge tone="green"><PartyPopper className="h-3.5 w-3.5" /> Faculty</Badge>}
      />

      {/* Employment summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={<Building2 className="h-4 w-4" />} label="Department" value={employee.department} />
        <InfoCard icon={<CalendarDays className="h-4 w-4" />} label="Joined" value={formatDate(employee.joinDate)} />
        <InfoCard icon={<BadgeIndianRupee className="h-4 w-4" />} label="Latest net pay" value={latest ? formatCurrency(latest.net) : '—'} sub={latest ? latest.month : undefined} />
        <InfoCard icon={<Clock className="h-4 w-4" />} label="Pending time-off" value={String(pendingTimeOff)} />
      </div>

      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Quick actions</h3>
      <QuickGrid items={FACULTY_QUICK} />
    </div>
  )
}

/* -------------------------------- Shared -------------------------------- */

function InfoCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
          <span className="text-brand-500 dark:text-brand-300">{icon}</span> {label}
        </p>
        <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
      </CardBody>
    </Card>
  )
}

function QuickGrid({ items }: { items: { to: string; label: string; desc: string; icon: typeof User }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((q) => (
        <Link key={q.to} to={q.to} className="card group flex items-center gap-3 p-4 transition hover:shadow-lift">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <q.icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-800 dark:text-slate-100">{q.label}</p>
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">{q.desc}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
        </Link>
      ))}
    </div>
  )
}
