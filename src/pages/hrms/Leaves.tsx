import { useMemo, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Check, X, CalendarOff } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { applyLeave, decideLeave } from '@/lib/hrms'
import type { LeaveRequest, LeaveType } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard, EmptyState } from '@/components/ui/misc'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusPill, Badge } from '@/components/ui/Badge'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'

const LEAVE_TYPES: LeaveType[] = ['casual', 'sick', 'earned', 'unpaid']

export function Leaves() {
  const { user } = useAuth()
  const employees = useLiveQuery(() => db.employees.toArray(), [])
  const leaves = useLiveQuery(() => db.leaves.reverse().sortBy('createdAt'), [])
  const [modal, setModal] = useState(false)

  const empName = useMemo(() => new Map((employees ?? []).map((e) => [e.id, e.name])), [employees])
  const admin = user ? { id: user.id, name: user.name } : { id: '', name: '' }

  const pending = (leaves ?? []).filter((l) => l.status === 'pending')
  const approved = (leaves ?? []).filter((l) => l.status === 'approved')
  const rejected = (leaves ?? []).filter((l) => l.status === 'rejected')

  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle="Review and decide on time-off requests"
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal(true)}>New request</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={pending.length} tone="amber" />
        <StatCard label="Approved" value={approved.length} tone="green" />
        <StatCard label="Rejected" value={rejected.length} tone="red" />
      </div>

      {(leaves ?? []).length === 0 ? (
        <EmptyState icon={<CalendarOff className="h-7 w-7" />} title="No leave requests" description="Requests will appear here for approval." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {leaves?.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-3 p-4">
              <Avatar name={empName.get(l.employeeId) ?? '?'} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{empName.get(l.employeeId) ?? 'Unknown'}</p>
                  <Badge tone="blue" className="capitalize">{l.type}</Badge>
                </div>
                <p className="text-xs text-slate-500">{l.from}{l.to !== l.from ? ` → ${l.to}` : ''} · {l.reason}</p>
              </div>
              <StatusPill status={l.status} />
              {l.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="success" icon={<Check className="h-3.5 w-3.5" />} onClick={async () => { await decideLeave(l, 'approved', admin); toast.success('Leave approved') }}>Approve</Button>
                  <Button size="sm" variant="outline" className="text-red-600" icon={<X className="h-3.5 w-3.5" />} onClick={async () => { await decideLeave(l, 'rejected', admin); toast.info('Leave rejected') }}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      <NewLeaveModal open={modal} onClose={() => setModal(false)} />
    </div>
  )

  function NewLeaveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [form, setForm] = useState({ employeeId: '', type: 'casual' as LeaveType, from: '', to: '', reason: '' })
    const [saving, setSaving] = useState(false)
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

    const submit = async (e: FormEvent) => {
      e.preventDefault()
      if (!form.employeeId) return toast.error('Pick an employee')
      setSaving(true)
      try {
        await applyLeave({
          employeeId: form.employeeId,
          type: form.type,
          from: form.from,
          to: form.to || form.from,
          reason: form.reason,
        } as Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>)
        toast.success('Leave request submitted')
        onClose()
        setForm({ employeeId: '', type: 'casual', from: '', to: '', reason: '' })
      } finally {
        setSaving(false)
      }
    }

    return (
      <Modal open={open} onClose={onClose} title="New leave request" size="md">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Employee" required>
            <Select value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} required>
              <option value="">Select employee…</option>
              {employees?.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Type">
              <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
                {LEAVE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </Select>
            </Field>
            <Field label="From" required><Input type="date" value={form.from} onChange={(e) => set('from', e.target.value)} required /></Field>
            <Field label="To"><Input type="date" value={form.to} onChange={(e) => set('to', e.target.value)} /></Field>
          </div>
          <Field label="Reason" required><Textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Reason for leave…" required /></Field>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>Submit request</Button>
          </div>
        </form>
      </Modal>
    )
  }
}
