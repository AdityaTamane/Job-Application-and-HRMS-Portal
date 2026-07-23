import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, ScrollText } from 'lucide-react'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/misc'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/form'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils'

const ACTION_TONE: Record<string, 'green' | 'red' | 'amber' | 'blue' | 'gray' | 'purple'> = {
  verify_student: 'green',
  approve_document: 'green',
  reject_student: 'red',
  reject_document: 'red',
  sos: 'red',
  create_booking: 'blue',
  cancel_booking: 'amber',
  start_work: 'purple',
  end_work: 'green',
}

export function AdminAudit() {
  const audit = useLiveQuery(() => db.audit.reverse().sortBy('createdAt'), [])
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    let list = audit ?? []
    if (q.trim()) {
      const query = q.toLowerCase()
      list = list.filter(
        (a) => a.actorName.toLowerCase().includes(query) || a.action.toLowerCase().includes(query) || (a.meta ?? '').toLowerCase().includes(query),
      )
    }
    return list
  }, [audit, q])

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="An immutable trail of every significant action" />

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <Input className="pl-9" placeholder="Search by actor, action, detail…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ScrollText className="h-7 w-7" />} title="No log entries" description="Actions across the platform will appear here." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">{formatDateTime(a.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{a.actorName}</td>
                    <td className="px-4 py-3"><Badge tone={ACTION_TONE[a.action] ?? 'gray'}>{a.action.replace(/_/g, ' ')}</Badge></td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{a.meta ?? '—'}</td>
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
