import { useMemo, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { ShieldCheck, Users, Briefcase, UserPlus, Clock, ArrowRight, Activity, Radar } from 'lucide-react'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard, EmptyState } from '@/components/ui/misc'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusPill } from '@/components/ui/Badge'
import { timeAgo } from '@/lib/utils'

export function AdminOverview() {
  const students = useLiveQuery(() => db.students.toArray(), [])
  const jobs = useLiveQuery(() => db.jobs.toArray(), [])
  const applicants = useLiveQuery(() => db.applicants.toArray(), [])
  const employees = useLiveQuery(() => db.employees.toArray(), [])
  const audit = useLiveQuery(() => db.audit.reverse().limit(8).toArray(), [])

  const stats = useMemo(() => {
    const s = students ?? []
    const j = jobs ?? []
    return {
      pendingVerify: s.filter((x) => x.verificationStatus === 'pending').length,
      verified: s.filter((x) => x.verificationStatus === 'verified').length,
      students: s.length,
      activeJobs: j.filter((x) => ['assigned', 'accepted', 'verifying', 'in_progress'].includes(x.status)).length,
      applicants: (applicants ?? []).filter((a) => !['hired', 'rejected'].includes(a.stage)).length,
      employees: (employees ?? []).filter((e) => e.status !== 'terminated').length,
    }
  }, [students, jobs, applicants, employees])

  const pendingStudents = (students ?? []).filter((s) => s.verificationStatus === 'pending')

  return (
    <div>
      <PageHeader title="Lighthouse Overview" subtitle="Everything happening across the platform at a glance" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Pending reviews" value={stats.pendingVerify} tone="amber" icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Verified pros" value={stats.verified} tone="green" icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard label="Total students" value={stats.students} tone="brand" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active jobs" value={stats.activeJobs} tone="purple" icon={<Briefcase className="h-5 w-5" />} />
        <StatCard label="Open applicants" value={stats.applicants} tone="amber" icon={<UserPlus className="h-5 w-5" />} />
        <StatCard label="Employees" value={stats.employees} tone="brand" icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending verification queue */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Awaiting verification"
            subtitle="Students who submitted documents for review"
            action={<Link to="/admin/verification"><Button variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />}>Open queue</Button></Link>}
          />
          <CardBody className="space-y-3">
            {pendingStudents.length === 0 ? (
              <EmptyState icon={<ShieldCheck className="h-6 w-6" />} title="All caught up" description="No pending verification requests." />
            ) : (
              pendingStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <Avatar src={s.photoUrl} name={s.name} size={40} />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.academyBatch} · {s.neighbourhood}</p>
                  </div>
                  <StatusPill status="pending" />
                  <Link to="/admin/verification"><Button size="sm">Review</Button></Link>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader title="Recent activity" action={<Activity className="h-4 w-4 text-slate-300" />} />
          <CardBody>
            {!audit?.length ? (
              <p className="py-6 text-center text-sm text-slate-400">No activity yet</p>
            ) : (
              <ul className="space-y-3">
                {audit.map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                    <div>
                      <p className="text-slate-700">
                        <span className="font-medium">{a.actorName}</span>{' '}
                        <span className="text-slate-500">{a.action.replace(/_/g, ' ')}</span>
                        {a.meta && <span className="text-slate-400"> · {a.meta}</span>}
                      </p>
                      <p className="text-xs text-slate-400">{timeAgo(a.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickCard to="/admin/verification" icon={<ShieldCheck className="h-5 w-5" />} label="Verify documents" />
        <QuickCard to="/admin/students" icon={<Users className="h-5 w-5" />} label="Manage students" />
        <QuickCard to="/admin/jobs" icon={<Radar className="h-5 w-5" />} label="Marketplace ops" />
        <QuickCard to="/admin/hiring" icon={<UserPlus className="h-5 w-5" />} label="Teacher hiring" />
      </div>
    </div>
  )
}

function QuickCard({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="card flex items-center gap-3 p-4 transition hover:border-brand-200 hover:shadow-lift">
      <span className="rounded-lg bg-brand-50 p-2 text-brand-600">{icon}</span>
      <span className="font-medium text-slate-700">{label}</span>
      <ArrowRight className="ml-auto h-4 w-4 text-slate-300" />
    </Link>
  )
}
