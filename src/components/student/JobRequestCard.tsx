import { CalendarClock, MapPin, Receipt, Check, X, HandHelping } from 'lucide-react'
import type { Job } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Badge, StatusPill } from '@/components/ui/Badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export function JobRequestCard({
  job,
  categoryName,
  customerName,
  variant,
  onAccept,
  onDecline,
  onPickup,
  busy,
}: {
  job: Job
  categoryName: string
  customerName: string
  variant: 'assigned' | 'open' | 'plain'
  onAccept?: () => void
  onDecline?: () => void
  onPickup?: () => void
  busy?: boolean
}) {
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-slate-900">{job.title}</h3>
        <Badge tone="blue">{categoryName}</Badge>
        {variant === 'plain' && <StatusPill status={job.status} />}
      </div>
      {job.description && <p className="mt-1 text-sm text-slate-600">{job.description}</p>}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {formatDateTime(job.scheduledAt)}</span>
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.address || job.neighbourhood}</span>
        <span className="flex items-center gap-1"><Receipt className="h-3.5 w-3.5" /> {formatCurrency(job.estimatedPrice)} · {job.durationHours}h</span>
      </div>
      <p className="mt-2 text-xs text-slate-400">Requested by {customerName}</p>

      {variant === 'assigned' && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="success" className="flex-1" icon={<Check className="h-4 w-4" />} loading={busy} onClick={onAccept}>
            Accept
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-red-600" icon={<X className="h-4 w-4" />} disabled={busy} onClick={onDecline}>
            Decline
          </Button>
        </div>
      )}
      {variant === 'open' && (
        <Button size="sm" className="mt-3 w-full" icon={<HandHelping className="h-4 w-4" />} loading={busy} onClick={onPickup}>
          Pick up this job
        </Button>
      )}
    </div>
  )
}
