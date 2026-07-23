import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, X, Inbox, CalendarOff, CalendarClock } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { decideWorkforceRequest } from '@/lib/workforce'
import type { WorkforceRequest } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard, EmptyState, Tabs } from '@/components/ui/misc'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusPill, Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/toast'
import { cn, timeAgo } from '@/lib/utils'

export function AdminRequests() {
  const { user } = useAuth()
  const [tab, setTab] = useState('pending')
  const requests = useLiveQuery(() => db.workforceRequests.reverse().sortBy('createdAt'), [])

  const admin = user ? { id: user.id, name: user.name } : { id: '', name: '' }
  const all = requests ?? []
  const pending = all.filter((r) => r.status === 'pending')
  const approved = all.filter((r) => r.status === 'approved')
  const rejected = all.filter((r) => r.status === 'rejected')

  const groups: Record<string, WorkforceRequest[]> = { pending, approved, rejected, all }
  const list = groups[tab] ?? all

  return (
    <div>
      <PageHeader title="Leave & Regularization" subtitle="Approve time-off and attendance corrections from students & teachers" />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={pending.length} tone="amber" />
        <StatCard label="Approved" value={approved.length} tone="green" />
        <StatCard label="Rejected" value={rejected.length} tone="red" />
      </div>

      <div className="mb-5">
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'pending', label: 'Pending', count: pending.length || undefined },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All' },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Inbox className="h-7 w-7" />} title="Nothing here" description="Requests submitted by students and teachers show up here for review." />
      ) : (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          {list.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
              <Avatar name={r.applicantName} size={40} />
              <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', r.kind === 'leave' ? 'bg-beacon-50 text-beacon-600 dark:bg-beacon-400/15 dark:text-beacon-300' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300')}>
                {r.kind === 'leave' ? <CalendarOff className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{r.applicantName}</p>
                  <Badge tone={r.applicantRole === 'teacher' ? 'purple' : 'blue'} className="capitalize">{r.applicantRole}</Badge>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {r.kind === 'leave'
                      ? `${r.leaveType} leave · ${r.from}${r.to && r.to !== r.from ? ` → ${r.to}` : ''}`
                      : `regularize ${r.date} → ${r.requestedStatus?.toUpperCase()}`}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{r.reason} · {timeAgo(r.createdAt)}</p>
              </div>
              <StatusPill status={r.status} />
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="success" icon={<Check className="h-3.5 w-3.5" />} onClick={async () => { await decideWorkforceRequest(r, 'approved', admin); toast.success('Request approved') }}>Approve</Button>
                  <Button size="sm" variant="outline" className="text-red-600" icon={<X className="h-3.5 w-3.5" />} onClick={async () => { await decideWorkforceRequest(r, 'rejected', admin); toast.info('Request rejected') }}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
