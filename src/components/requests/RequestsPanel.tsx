import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, CalendarOff, CalendarClock } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { applyWorkforceRequest } from '@/lib/workforce'
import type {
  AttendanceStatus, LeaveType, WorkforceApplicantRole, WorkforceRequestKind,
} from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard, EmptyState } from '@/components/ui/misc'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { StatusPill, Badge } from '@/components/ui/Badge'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'
import { cn, timeAgo } from '@/lib/utils'

const LEAVE_TYPES: LeaveType[] = ['casual', 'sick', 'earned', 'unpaid']
const ATT_STATUSES: AttendanceStatus[] = ['present', 'wfh', 'leave', 'absent']
const today = () => new Date().toISOString().slice(0, 10)

/**
 * Self-service leave & attendance-regularization panel for students / teachers.
 * They apply here; the admin approves in the Requests queue.
 */
export function RequestsPanel({ subtitle }: { subtitle?: string }) {
  const { user } = useAuth()
  const [modal, setModal] = useState<WorkforceRequestKind | null>(null)

  const requests = useLiveQuery(
    () => (user ? db.workforceRequests.where('applicantId').equals(user.id).reverse().sortBy('createdAt') : []),
    [user?.id],
  )

  if (!user) return null
  const list = requests ?? []
  const pending = list.filter((r) => r.status === 'pending').length
  const approved = list.filter((r) => r.status === 'approved').length
  const rejected = list.filter((r) => r.status === 'rejected').length

  return (
    <div>
      <PageHeader
        title="Time Off & Regularization"
        subtitle={subtitle ?? 'Apply for leave or an attendance correction — the Lighthouse team reviews it'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={<CalendarClock className="h-4 w-4" />} onClick={() => setModal('regularization')}>Regularize</Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal('leave')}>Apply leave</Button>
          </div>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={pending} tone="amber" />
        <StatCard label="Approved" value={approved} tone="green" />
        <StatCard label="Rejected" value={rejected} tone="red" />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<CalendarOff className="h-7 w-7" />}
          title="No requests yet"
          description="Apply for leave or request an attendance correction and track its approval status here."
          action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal('leave')}>Apply for leave</Button>}
        />
      ) : (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          {list.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', r.kind === 'leave' ? 'bg-beacon-50 text-beacon-600 dark:bg-beacon-400/15 dark:text-beacon-300' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300')}>
                {r.kind === 'leave' ? <CalendarOff className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium capitalize text-slate-800 dark:text-slate-100">
                    {r.kind === 'leave' ? `${r.leaveType} leave` : 'Regularization'}
                  </p>
                  {r.kind === 'leave' ? (
                    <Badge tone="gray">{r.from}{r.to && r.to !== r.from ? ` → ${r.to}` : ''}</Badge>
                  ) : (
                    <>
                      <Badge tone="gray">{r.date}</Badge>
                      {r.requestedStatus && <StatusPill status={r.requestedStatus} />}
                    </>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {r.reason} · {timeAgo(r.createdAt)}
                  {r.status !== 'pending' && r.approverName ? ` · by ${r.approverName}` : ''}
                </p>
              </div>
              <StatusPill status={r.status} />
            </div>
          ))}
        </Card>
      )}

      <RequestModal
        kind={modal}
        onClose={() => setModal(null)}
        applicant={{ id: user.id, name: user.name, role: user.role as WorkforceApplicantRole }}
      />
    </div>
  )
}

function RequestModal({
  kind, onClose, applicant,
}: {
  kind: WorkforceRequestKind | null
  onClose: () => void
  applicant: { id: string; name: string; role: WorkforceApplicantRole }
}) {
  const [form, setForm] = useState({
    leaveType: 'casual' as LeaveType, from: today(), to: '',
    date: today(), requestedStatus: 'present' as AttendanceStatus, checkIn: '', checkOut: '',
    reason: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!kind) return
    if (!form.reason.trim()) return toast.error('Please add a reason')
    setSaving(true)
    try {
      await applyWorkforceRequest(
        kind === 'leave'
          ? {
              applicantId: applicant.id, applicantName: applicant.name, applicantRole: applicant.role,
              kind: 'leave', leaveType: form.leaveType, from: form.from, to: form.to || form.from,
              reason: form.reason,
            }
          : {
              applicantId: applicant.id, applicantName: applicant.name, applicantRole: applicant.role,
              kind: 'regularization', date: form.date, requestedStatus: form.requestedStatus,
              checkIn: form.checkIn || undefined, checkOut: form.checkOut || undefined,
              reason: form.reason,
            },
      )
      toast.success(kind === 'leave' ? 'Leave request submitted' : 'Regularization request submitted')
      onClose()
      setForm((f) => ({ ...f, reason: '', to: '', checkIn: '', checkOut: '' }))
    } finally {
      setSaving(false)
    }
  }

  const needsTimes = form.requestedStatus === 'present' || form.requestedStatus === 'wfh'

  return (
    <Modal open={!!kind} onClose={onClose} title={kind === 'leave' ? 'Apply for leave' : 'Attendance regularization'} size="md">
      <form onSubmit={submit} className="space-y-4">
        {kind === 'leave' ? (
          <>
            <Field label="Leave type">
              <Select value={form.leaveType} onChange={(e) => set('leaveType', e.target.value)}>
                {LEAVE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="From" required><Input type="date" value={form.from} onChange={(e) => set('from', e.target.value)} required /></Field>
              <Field label="To"><Input type="date" value={form.to} min={form.from} onChange={(e) => set('to', e.target.value)} /></Field>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Date" required><Input type="date" value={form.date} max={today()} onChange={(e) => set('date', e.target.value)} required /></Field>
              <Field label="Mark as">
                <Select value={form.requestedStatus} onChange={(e) => set('requestedStatus', e.target.value)}>
                  {ATT_STATUSES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </Select>
              </Field>
            </div>
            {needsTimes && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Check-in"><Input type="time" value={form.checkIn} onChange={(e) => set('checkIn', e.target.value)} /></Field>
                <Field label="Check-out"><Input type="time" value={form.checkOut} onChange={(e) => set('checkOut', e.target.value)} /></Field>
              </div>
            )}
          </>
        )}
        <Field label="Reason" required>
          <Textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder={kind === 'leave' ? 'Reason for leave…' : 'e.g. Forgot to check out after a client visit…'} required />
        </Field>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={saving}>Submit request</Button>
        </div>
      </form>
    </Modal>
  )
}
