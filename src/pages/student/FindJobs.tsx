import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Inbox, Compass, ShieldAlert } from 'lucide-react'
import { db } from '@/lib/db'
import { acceptJob, declineJob, pickUpJob } from '@/lib/student'
import { useStudent } from '@/hooks/useStudent'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader, EmptyState } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import { JobRequestCard } from '@/components/student/JobRequestCard'
import { toast } from '@/components/ui/toast'

export function FindJobs() {
  const student = useStudent()
  const jobs = useLiveQuery(() => db.jobs.toArray(), [])
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const users = useLiveQuery(() => db.users.toArray(), [])
  const [busyId, setBusyId] = useState<string | null>(null)

  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories])
  const userName = useMemo(() => new Map((users ?? []).map((u) => [u.id, u.name])), [users])

  const { assigned, open } = useMemo(() => {
    const all = jobs ?? []
    return {
      assigned: student ? all.filter((j) => j.studentId === student.id && j.status === 'assigned') : [],
      open: student
        ? all.filter(
            (j) =>
              j.status === 'requested' &&
              !j.studentId &&
              (student.serviceCategoryIds.includes(j.categoryId) || j.neighbourhood === student.neighbourhood),
          )
        : [],
    }
  }, [jobs, student])

  if (!student) return <PageLoader />

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id)
    try {
      await fn()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Find Jobs" subtitle="Accept requests sent to you, or pick up open jobs nearby" />

      {student.verificationStatus !== 'verified' && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-beacon-200 bg-beacon-50 p-4">
          <ShieldAlert className="h-5 w-5 shrink-0 text-beacon-600" />
          <p className="flex-1 text-sm text-beacon-800">
            Get verified to appear higher in search and win more customer trust.
          </p>
          <Link to="/student/verification">
            <Button size="sm" variant="secondary">Verify now</Button>
          </Link>
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Requests for you ({assigned.length})
        </h2>
        {assigned.length === 0 ? (
          <EmptyState icon={<Inbox className="h-7 w-7" />} title="No pending requests" description="New booking requests sent directly to you will appear here." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assigned.map((job) => (
              <JobRequestCard
                key={job.id}
                job={job}
                variant="assigned"
                categoryName={catName.get(job.categoryId) ?? 'Service'}
                customerName={userName.get(job.customerId) ?? 'Customer'}
                busy={busyId === job.id}
                onAccept={() => withBusy(job.id, async () => { await acceptJob(job, student); toast.success('Job accepted!') })}
                onDecline={() => withBusy(job.id, async () => { await declineJob(job, student); toast.info('Job declined') })}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Open requests near you ({open.length})
        </h2>
        {open.length === 0 ? (
          <EmptyState icon={<Compass className="h-7 w-7" />} title="No open jobs right now" description="Open requests matching your skills or neighbourhood will show up here." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {open.map((job) => (
              <JobRequestCard
                key={job.id}
                job={job}
                variant="open"
                categoryName={catName.get(job.categoryId) ?? 'Service'}
                customerName={userName.get(job.customerId) ?? 'Customer'}
                busy={busyId === job.id}
                onPickup={() => withBusy(job.id, async () => { await pickUpJob(job, student); toast.success('Job picked up!') })}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
