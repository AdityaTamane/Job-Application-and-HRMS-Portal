import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Siren, Scale, Flag, ShieldAlert, MapPin, CheckCircle2, XCircle, Search } from 'lucide-react'
import { db } from '@/lib/db'
import { setIncidentStatus } from '@/lib/incidents'
import type { IncidentCase, IncidentStatus, IncidentType } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard, EmptyState, Tabs } from '@/components/ui/misc'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'
import { cn, timeAgo } from '@/lib/utils'

const TYPE_ICON: Record<IncidentType, typeof Siren> = { sos: Siren, dispute: Scale, complaint: Flag }
const PRIORITY_TONE = {
  high: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  medium: 'bg-beacon-50 text-beacon-800 dark:bg-beacon-400/15 dark:text-beacon-200',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}
const STATUS_TONE: Record<IncidentStatus, 'amber' | 'purple' | 'green' | 'gray'> = {
  open: 'amber',
  investigating: 'purple',
  resolved: 'green',
  dismissed: 'gray',
}

export function AdminIncidents() {
  const incidents = useLiveQuery(() => db.incidents.reverse().sortBy('createdAt'), [])
  const [tab, setTab] = useState<'active' | 'all' | 'resolved'>('active')
  const [selected, setSelected] = useState<IncidentCase | null>(null)

  const all = incidents ?? []
  const stats = useMemo(() => {
    const a = incidents ?? []
    return {
      open: a.filter((i) => i.status === 'open').length,
      high: a.filter((i) => i.priority === 'high' && i.status !== 'resolved' && i.status !== 'dismissed').length,
      resolved: a.filter((i) => i.status === 'resolved').length,
    }
  }, [incidents])

  const list = all.filter((i) => {
    if (tab === 'active') return i.status === 'open' || i.status === 'investigating'
    if (tab === 'resolved') return i.status === 'resolved' || i.status === 'dismissed'
    return true
  })

  return (
    <div>
      <PageHeader title="Safety & Disputes" subtitle="SOS alerts, disputes and complaints across the platform" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open cases" value={stats.open} tone="amber" icon={<ShieldAlert className="h-5 w-5" />} />
        <StatCard label="High priority" value={stats.high} tone="red" icon={<Siren className="h-5 w-5" />} />
        <StatCard label="Resolved" value={stats.resolved} tone="green" icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="mb-5">
        <Tabs
          active={tab}
          onChange={(t) => setTab(t as typeof tab)}
          tabs={[
            { id: 'active', label: 'Active', count: all.filter((i) => i.status === 'open' || i.status === 'investigating').length },
            { id: 'resolved', label: 'Closed', count: all.filter((i) => i.status === 'resolved' || i.status === 'dismissed').length },
            { id: 'all', label: 'All', count: all.length },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<ShieldAlert className="h-7 w-7" />} title="No cases here" description="Safety alerts and disputes will appear in this queue." />
      ) : (
        <div className="space-y-3">
          {list.map((inc) => {
            const Icon = TYPE_ICON[inc.type]
            return (
              <Card key={inc.id} className="flex items-start gap-3 p-4 transition hover:shadow-lift">
                <div
                  className={cn(
                    'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                    inc.type === 'sos' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{inc.subject}</h3>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', PRIORITY_TONE[inc.priority])}>
                      {inc.priority}
                    </span>
                    <Badge tone={STATUS_TONE[inc.status]}>{inc.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{inc.description}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                    <span>By {inc.raisedByName} ({inc.raisedByRole})</span>
                    {inc.lat && inc.lng && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {inc.lat.toFixed(4)}, {inc.lng.toFixed(4)}</span>
                    )}
                    <span>{timeAgo(inc.createdAt)}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelected(inc)}>Manage</Button>
              </Card>
            )
          })}
        </div>
      )}

      <CaseModal incident={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function CaseModal({ incident, onClose }: { incident: IncidentCase | null; onClose: () => void }) {
  const [note, setNote] = useState('')
  if (!incident) return null

  const act = async (status: IncidentStatus) => {
    await setIncidentStatus(incident, status, note.trim() || undefined)
    toast.success(`Case marked ${status}`)
    setNote('')
    onClose()
  }

  return (
    <Modal open={!!incident} onClose={onClose} title="Manage case" size="md">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{incident.subject}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{incident.description}</p>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Reported by {incident.raisedByName} · {timeAgo(incident.createdAt)}
          </p>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Resolution note</p>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What action was taken?" />
        </div>

        <div className="flex flex-wrap gap-2">
          {incident.status !== 'investigating' && incident.status !== 'resolved' && (
            <Button variant="secondary" icon={<Search className="h-4 w-4" />} onClick={() => act('investigating')}>
              Start investigating
            </Button>
          )}
          <Button variant="success" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => act('resolved')}>
            Mark resolved
          </Button>
          <Button variant="ghost" className="text-slate-500" icon={<XCircle className="h-4 w-4" />} onClick={() => act('dismissed')}>
            Dismiss
          </Button>
        </div>
      </div>
    </Modal>
  )
}
