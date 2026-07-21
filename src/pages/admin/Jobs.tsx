import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, Briefcase, Siren } from 'lucide-react'
import { db } from '@/lib/db'
import type { JobStatus } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard, EmptyState } from '@/components/ui/misc'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/form'
import { StatusPill } from '@/components/ui/Badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export function AdminJobs() {
  const jobs = useLiveQuery(() => db.jobs.reverse().sortBy('createdAt'), [])
  const students = useLiveQuery(() => db.students.toArray(), [])
  const users = useLiveQuery(() => db.users.toArray(), [])
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const sessions = useLiveQuery(() => db.workSessions.toArray(), [])

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<JobStatus | 'all'>('all')

  const studentName = useMemo(() => new Map((students ?? []).map((s) => [s.id, s.name])), [students])
  const userName = useMemo(() => new Map((users ?? []).map((u) => [u.id, u.name])), [users])
  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories])
  const sosJobs = useMemo(() => new Set((sessions ?? []).filter((s) => s.sosTriggered).map((s) => s.jobId)), [sessions])

  const filtered = useMemo(() => {
    let list = jobs ?? []
    if (status !== 'all') list = list.filter((j) => j.status === status)
    if (q.trim()) {
      const query = q.toLowerCase()
      list = list.filter((j) => j.title.toLowerCase().includes(query) || j.neighbourhood.toLowerCase().includes(query))
    }
    return list
  }, [jobs, status, q])

  const stats = useMemo(() => {
    const all = jobs ?? []
    return {
      total: all.length,
      active: all.filter((j) => ['assigned', 'accepted', 'verifying', 'in_progress'].includes(j.status)).length,
      completed: all.filter((j) => j.status === 'completed').length,
      revenue: all.filter((j) => j.status === 'completed').reduce((s, j) => s + j.estimatedPrice, 0),
    }
  }, [jobs])

  return (
    <div>
      <PageHeader title="Marketplace Operations" subtitle="Monitor all bookings across the platform" />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total jobs" value={stats.total} tone="brand" icon={<Briefcase className="h-5 w-5" />} />
        <StatCard label="Active now" value={stats.active} tone="purple" />
        <StatCard label="Completed" value={stats.completed} tone="green" />
        <StatCard label="GMV (completed)" value={formatCurrency(stats.revenue)} tone="amber" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input className="pl-9" placeholder="Search jobs…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as JobStatus | 'all')} className="sm:w-48">
          <option value="all">All statuses</option>
          {['requested', 'assigned', 'accepted', 'verifying', 'in_progress', 'completed', 'cancelled', 'declined'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Briefcase className="h-7 w-7" />} title="No jobs found" description="Adjust your filters to see bookings." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Job</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Pro</th>
                  <th className="px-4 py-3 font-medium">Schedule</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j) => (
                  <tr key={j.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">{j.title}</span>
                        {sosJobs.has(j.id) && <Siren className="h-4 w-4 text-red-500" />}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{catName.get(j.categoryId)} · {j.neighbourhood}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{userName.get(j.customerId) ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{j.studentId ? studentName.get(j.studentId) : <span className="text-slate-300">Unassigned</span>}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDateTime(j.scheduledAt)}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{formatCurrency(j.estimatedPrice)}</td>
                    <td className="px-4 py-3"><StatusPill status={j.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
