import { useMemo, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Star, Briefcase, Wallet, Inbox, ArrowRight, ShieldCheck, Radar, CalendarClock, MapPin } from 'lucide-react'
import { db } from '@/lib/db'
import { useStudent } from '@/hooks/useStudent'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader, StatCard, EmptyState } from '@/components/ui/misc'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'
import { AvailabilityToggle } from '@/components/student/AvailabilityToggle'
import { ProfileStrength } from '@/components/student/ProfileStrength'
import { StreakCard, LeaderboardCard } from '@/components/student/Gamification'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const ACTIVE_STATUSES = ['accepted', 'en_route', 'verifying', 'in_progress']

export function StudentDashboard() {
  const student = useStudent()
  const jobs = useLiveQuery(
    async () => (student ? db.jobs.where('studentId').equals(student.id).toArray() : []),
    [student?.id],
  )
  const allStudents = useLiveQuery(() => db.students.toArray(), [])

  const stats = useMemo(() => {
    const all = jobs ?? []
    return {
      pending: all.filter((j) => j.status === 'assigned').length,
      active: all.filter((j) => ACTIVE_STATUSES.includes(j.status)),
      earnings: all.filter((j) => j.status === 'completed').reduce((s, j) => s + j.estimatedPrice, 0),
    }
  }, [jobs])

  if (!student) return <PageLoader />

  return (
    <div>
      <PageHeader
        title={`Welcome, ${student.name.split(' ')[0]} 👋`}
        subtitle="Here's what's happening with your work today"
        actions={<AvailabilityToggle student={student} />}
      />

      {/* Verification nudge / status */}
      {student.verificationStatus === 'verified' ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <ShieldCheck className="h-6 w-6 text-emerald-600" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-800">You're verified</p>
            <p className="text-sm text-emerald-700">Customers can see your <VerifiedBadge tier={student.badgeTier} showLabel={false} size="sm" /> badge.</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-beacon-200 bg-beacon-50 p-4 sm:flex-row sm:items-center">
          <ShieldCheck className="h-6 w-6 text-beacon-600" />
          <div className="flex-1">
            <p className="font-semibold text-beacon-800">Complete your verification</p>
            <p className="text-sm text-beacon-700">Verified pros get more bookings and appear higher in search.</p>
          </div>
          <Link to="/student/verification">
            <Button variant="secondary" size="sm">Get verified</Button>
          </Link>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Rating" value={student.rating ? student.rating.toFixed(1) : '—'} sub={`${student.ratingCount} reviews`} tone="amber" icon={<Star className="h-5 w-5" />} />
        <StatCard label="Jobs completed" value={student.jobsCompleted} tone="green" icon={<Briefcase className="h-5 w-5" />} />
        <StatCard label="Total earnings" value={formatCurrency(stats.earnings)} tone="brand" icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="Pending requests" value={stats.pending} tone="purple" icon={<Inbox className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Active & upcoming work"
            action={<Link to="/student/jobs"><Button variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />}>Find jobs</Button></Link>}
          />
          <CardBody className="space-y-3">
            {stats.active.length === 0 ? (
              <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No active jobs" description="Accepted jobs will appear here, ready to start." />
            ) : (
              stats.active.map((job) => (
                <div key={job.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 dark:border-slate-800 p-3.5 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{job.title}</p>
                      <StatusPill status={job.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {formatDateTime(job.scheduledAt)}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.neighbourhood}</span>
                    </div>
                  </div>
                  <Link to="/student/active">
                    <Button size="sm" icon={<Radar className="h-4 w-4" />}>Start / track</Button>
                  </Link>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <ProfileStrength student={student} compact />
          <Card>
            <CardHeader title="Quick actions" />
            <CardBody className="space-y-2">
              <QuickLink to="/student/jobs" icon={<Inbox className="h-4 w-4" />} label="Browse job requests" />
              <QuickLink to="/student/verification" icon={<ShieldCheck className="h-4 w-4" />} label="Verification & documents" />
              <QuickLink to="/student/earnings" icon={<Wallet className="h-4 w-4" />} label="View earnings" />
              <QuickLink to="/student/profile" icon={<Star className="h-4 w-4" />} label="Edit profile & skills" />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Gamification: streak + leaderboard */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <StreakCard
          completedTimestamps={(jobs ?? [])
            .filter((j) => j.status === 'completed')
            .map((j) => j.scheduledAt || j.createdAt)}
        />
        <div className="lg:col-span-2">
          <LeaderboardCard students={allStudents ?? []} meId={student.id} />
        </div>
      </div>
    </div>
  )
}

function QuickLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 px-3.5 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 transition hover:border-brand-200 hover:bg-brand-50">
      <span className="text-brand-500">{icon}</span>
      {label}
      <ArrowRight className="ml-auto h-4 w-4 text-slate-300" />
    </Link>
  )
}
