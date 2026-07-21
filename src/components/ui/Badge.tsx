import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'purple'

const tones: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  blue: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber: 'bg-beacon-50 text-beacon-700 dark:bg-beacon-400/15 dark:text-beacon-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
}

export function Badge({
  tone = 'gray',
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

// Maps a status string to a tone + label for consistent pills everywhere.
const STATUS_MAP: Record<string, { tone: Tone; label: string }> = {
  // jobs
  requested: { tone: 'amber', label: 'Requested' },
  assigned: { tone: 'blue', label: 'Assigned' },
  accepted: { tone: 'blue', label: 'Accepted' },
  declined: { tone: 'red', label: 'Declined' },
  en_route: { tone: 'purple', label: 'En route' },
  verifying: { tone: 'amber', label: 'Verifying' },
  in_progress: { tone: 'purple', label: 'In progress' },
  completed: { tone: 'green', label: 'Completed' },
  cancelled: { tone: 'gray', label: 'Cancelled' },
  // verification
  unverified: { tone: 'gray', label: 'Unverified' },
  pending: { tone: 'amber', label: 'Pending' },
  verified: { tone: 'green', label: 'Verified' },
  rejected: { tone: 'red', label: 'Rejected' },
  approved: { tone: 'green', label: 'Approved' },
  // ATS
  applied: { tone: 'gray', label: 'Applied' },
  screening: { tone: 'blue', label: 'Screening' },
  interview: { tone: 'purple', label: 'Interview' },
  offer: { tone: 'amber', label: 'Offer' },
  hired: { tone: 'green', label: 'Hired' },
  // HRMS
  active: { tone: 'green', label: 'Active' },
  on_leave: { tone: 'amber', label: 'On leave' },
  terminated: { tone: 'red', label: 'Terminated' },
  present: { tone: 'green', label: 'Present' },
  absent: { tone: 'red', label: 'Absent' },
  leave: { tone: 'amber', label: 'Leave' },
  wfh: { tone: 'blue', label: 'WFH' },
  paid: { tone: 'green', label: 'Paid' },
  processed: { tone: 'blue', label: 'Processed' },
  draft: { tone: 'gray', label: 'Draft' },
}

export function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { tone: 'gray' as Tone, label: status }
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>
}
