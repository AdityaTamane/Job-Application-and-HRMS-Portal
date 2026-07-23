import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  format, addDays, parseISO, startOfMonth, endOfMonth,
  eachDayOfInterval, isWeekend, addMonths, subMonths,
} from 'date-fns'
import {
  LogIn, LogOut, CalendarClock, ChevronLeft, ChevronRight, Plus, Check, X,
  PenLine, CalendarDays, CheckCheck,
} from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import {
  checkIn, checkOut, setAttendanceStatus, markAllPresent, todayStr,
  applyAttendanceRequest, decideAttendanceRequest, summarizeAttendance,
} from '@/lib/hrms'
import type { Attendance as Att, AttendanceRequest, AttendanceStatus, Employee } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard, EmptyState, Tabs } from '@/components/ui/misc'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusPill, Badge } from '@/components/ui/Badge'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const STATUSES: AttendanceStatus[] = ['present', 'wfh', 'leave', 'absent']

export function Attendance() {
  const { user } = useAuth()
  const [tab, setTab] = useState('daily')
  const [date, setDate] = useState(todayStr())
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [request, setRequest] = useState<{ employeeId?: string; date?: string } | null>(null)

  const employees = useLiveQuery(() => db.employees.where('status').notEqual('terminated').toArray(), [])
  const dayAtt = useLiveQuery(() => db.attendance.where('date').equals(date).toArray(), [date])
  const monthAtt = useLiveQuery(() => db.attendance.filter((a) => a.date.startsWith(month)).toArray(), [month])
  const requests = useLiveQuery(() => db.attendanceRequests.reverse().sortBy('createdAt'), [])

  const admin = user ? { id: user.id, name: user.name } : { id: '', name: '' }
  const empName = useMemo(() => new Map((employees ?? []).map((e) => [e.id, e.name])), [employees])
  const pendingReqs = (requests ?? []).filter((r) => r.status === 'pending')

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Daily register, regularization requests & monthly summary"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setRequest({ date })}>
            New request
          </Button>
        }
      />

      <div className="mb-5">
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'daily', label: 'Daily register' },
            { id: 'requests', label: 'Regularization', count: pendingReqs.length || undefined },
            { id: 'summary', label: 'Monthly summary' },
          ]}
        />
      </div>

      {tab === 'daily' && (
        <DailyRegister
          date={date}
          setDate={setDate}
          employees={employees ?? []}
          dayAtt={dayAtt ?? []}
          onRegularize={(employeeId) => setRequest({ employeeId, date })}
        />
      )}

      {tab === 'requests' && (
        <RequestsTab requests={requests ?? []} empName={empName} admin={admin} />
      )}

      {tab === 'summary' && (
        <MonthlySummary
          month={month}
          setMonth={setMonth}
          employees={employees ?? []}
          monthAtt={monthAtt ?? []}
        />
      )}

      <RequestModal
        open={!!request}
        onClose={() => setRequest(null)}
        prefill={request ?? {}}
        employees={employees ?? []}
      />
    </div>
  )
}

/* ------------------------------- Daily register ------------------------------ */

function DailyRegister({
  date, setDate, employees, dayAtt, onRegularize,
}: {
  date: string
  setDate: (d: string) => void
  employees: Employee[]
  dayAtt: Att[]
  onRegularize: (employeeId: string) => void
}) {
  const isToday = date === todayStr()
  const attMap = useMemo(() => new Map(dayAtt.map((a) => [a.employeeId, a])), [dayAtt])

  const present = dayAtt.filter((a) => a.status === 'present' || a.status === 'wfh').length
  const onLeave = dayAtt.filter((a) => a.status === 'leave').length
  const notMarked = employees.length - dayAtt.filter((a) => a.status !== 'absent').length

  const shift = (n: number) => setDate(format(addDays(parseISO(date), n), 'yyyy-MM-dd'))

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" icon={<ChevronLeft className="h-4 w-4" />} onClick={() => shift(-1)} aria-label="Previous day" />
          <Input type="date" value={date} max={todayStr()} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-auto" />
          <Button size="sm" variant="outline" icon={<ChevronRight className="h-4 w-4" />} onClick={() => shift(1)} disabled={isToday} aria-label="Next day" />
          {!isToday && <Button size="sm" variant="ghost" onClick={() => setDate(todayStr())}>Today</Button>}
        </div>
        <Button size="sm" variant="secondary" icon={<CheckCheck className="h-4 w-4" />} onClick={async () => { await markAllPresent(employees.map((e) => e.id), date); toast.success('Marked everyone present') }}>
          Mark all present
        </Button>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Present / WFH" value={present} tone="green" />
        <StatCard label="On leave" value={onLeave} tone="amber" />
        <StatCard label="Not marked in" value={Math.max(0, notMarked)} tone="red" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Check-in</th>
                <th className="px-4 py-3 font-medium">Check-out</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const att = attMap.get(e.id)
                return (
                  <tr key={e.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={e.name} size={34} />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100">{e.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{e.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={att?.status ?? 'absent'}
                        onChange={(ev) => setAttendanceStatus(e.id, date, ev.target.value as AttendanceStatus)}
                        className="h-8 w-28 py-1 text-xs"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                      </Select>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{att?.checkIn ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{att?.checkOut ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {isToday ? (
                          <>
                            <Button size="sm" variant="outline" icon={<LogIn className="h-3.5 w-3.5" />} disabled={!!att?.checkIn} onClick={() => checkIn(e)}>In</Button>
                            <Button size="sm" variant="outline" icon={<LogOut className="h-3.5 w-3.5" />} disabled={!att?.checkIn || !!att?.checkOut} onClick={() => checkOut(e)}>Out</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" icon={<PenLine className="h-3.5 w-3.5" />} onClick={() => onRegularize(e.id)}>Regularize</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <CalendarClock className="h-3.5 w-3.5" /> <StatusPill status="present" /> and <StatusPill status="wfh" /> count toward payroll working days.
      </p>
    </>
  )
}

/* ---------------------------- Regularization tab ---------------------------- */

function RequestsTab({
  requests, empName, admin,
}: {
  requests: AttendanceRequest[]
  empName: Map<string, string>
  admin: { id: string; name: string }
}) {
  const pending = requests.filter((r) => r.status === 'pending')
  const approved = requests.filter((r) => r.status === 'approved')
  const rejected = requests.filter((r) => r.status === 'rejected')

  return (
    <>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={pending.length} tone="amber" />
        <StatCard label="Approved" value={approved.length} tone="green" />
        <StatCard label="Rejected" value={rejected.length} tone="red" />
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={<PenLine className="h-7 w-7" />}
          title="No regularization requests"
          description="Corrections to a missed punch or wrong status will appear here for approval."
        />
      ) : (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          {requests.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
              <Avatar name={empName.get(r.employeeId) ?? '?'} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{empName.get(r.employeeId) ?? 'Unknown'}</p>
                  <Badge tone="gray">{r.date}</Badge>
                  <span className="text-xs text-slate-400 dark:text-slate-500">→</span>
                  <StatusPill status={r.requestedStatus} />
                  {(r.checkIn || r.checkOut) && (
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {r.checkIn ?? '—'} – {r.checkOut ?? '—'}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{r.reason}</p>
              </div>
              <StatusPill status={r.status} />
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="success" icon={<Check className="h-3.5 w-3.5" />} onClick={async () => { await decideAttendanceRequest(r, 'approved', admin); toast.success('Request approved — attendance updated') }}>Approve</Button>
                  <Button size="sm" variant="outline" className="text-red-600" icon={<X className="h-3.5 w-3.5" />} onClick={async () => { await decideAttendanceRequest(r, 'rejected', admin); toast.info('Request rejected') }}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </>
  )
}

/* ----------------------------- Monthly summary ----------------------------- */

function MonthlySummary({
  month, setMonth, employees, monthAtt,
}: {
  month: string
  setMonth: (m: string) => void
  employees: Employee[]
  monthAtt: Att[]
}) {
  const workingDays = useMemo(() => {
    const start = startOfMonth(parseISO(`${month}-01`))
    const today = new Date()
    const monthEnd = endOfMonth(start)
    const end = monthEnd > today ? today : monthEnd
    if (end < start) return 0
    return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d)).length
  }, [month])

  const byEmp = useMemo(() => {
    const m = new Map<string, Att[]>()
    for (const a of monthAtt) {
      const list = m.get(a.employeeId) ?? []
      list.push(a)
      m.set(a.employeeId, list)
    }
    return m
  }, [monthAtt])

  const label = format(parseISO(`${month}-01`), 'MMMM yyyy')
  const isCurrentMonth = month === format(new Date(), 'yyyy-MM')
  const shift = (n: number) => setMonth(format(n < 0 ? subMonths(parseISO(`${month}-01`), 1) : addMonths(parseISO(`${month}-01`), 1), 'yyyy-MM'))

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" icon={<ChevronLeft className="h-4 w-4" />} onClick={() => shift(-1)} aria-label="Previous month" />
          <span className="min-w-[9rem] text-center text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
          <Button size="sm" variant="outline" icon={<ChevronRight className="h-4 w-4" />} onClick={() => shift(1)} disabled={isCurrentMonth} aria-label="Next month" />
        </div>
        <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" /> {workingDays} working days
        </span>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 text-center font-medium">Present</th>
                <th className="px-4 py-3 text-center font-medium">WFH</th>
                <th className="px-4 py-3 text-center font-medium">Leave</th>
                <th className="px-4 py-3 text-center font-medium">Absent</th>
                <th className="px-4 py-3 font-medium">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const s = summarizeAttendance(byEmp.get(e.id) ?? [], workingDays)
                const tone = s.rate >= 90 ? 'bg-emerald-500' : s.rate >= 75 ? 'bg-beacon-500' : 'bg-red-500'
                return (
                  <tr key={e.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={e.name} size={34} />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100">{e.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{e.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">{s.present}</td>
                    <td className="px-4 py-3 text-center text-brand-600 dark:text-brand-300">{s.wfh}</td>
                    <td className="px-4 py-3 text-center text-beacon-600 dark:text-beacon-300">{s.leave}</td>
                    <td className="px-4 py-3 text-center text-red-500">{s.absent}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${Math.min(100, s.rate)}%` }} />
                        </div>
                        <span className="w-10 text-xs font-semibold text-slate-600 dark:text-slate-300">{s.rate}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

/* ------------------------------ Request modal ------------------------------ */

function RequestModal({
  open, onClose, prefill, employees,
}: {
  open: boolean
  onClose: () => void
  prefill: { employeeId?: string; date?: string }
  employees: Employee[]
}) {
  const [form, setForm] = useState({
    employeeId: '', date: todayStr(), requestedStatus: 'present' as AttendanceStatus, checkIn: '', checkOut: '', reason: '',
  })
  const [saving, setSaving] = useState(false)
  // Reset the form to the prefill each time the modal opens.
  useEffect(() => {
    if (open) setForm({ employeeId: prefill.employeeId ?? '', date: prefill.date ?? todayStr(), requestedStatus: 'present', checkIn: '', checkOut: '', reason: '' })
  }, [open, prefill.employeeId, prefill.date])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.employeeId) return toast.error('Pick an employee')
    setSaving(true)
    try {
      await applyAttendanceRequest({
        employeeId: form.employeeId,
        date: form.date,
        requestedStatus: form.requestedStatus,
        checkIn: form.checkIn || undefined,
        checkOut: form.checkOut || undefined,
        reason: form.reason,
      })
      toast.success('Regularization request submitted')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const needsTimes = form.requestedStatus === 'present' || form.requestedStatus === 'wfh'

  return (
    <Modal open={open} onClose={onClose} title="Attendance regularization" size="md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Employee" required>
          <Select value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} required>
            <option value="">Select employee…</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Date" required><Input type="date" value={form.date} max={todayStr()} onChange={(e) => set('date', e.target.value)} required /></Field>
          <Field label="Mark as">
            <Select value={form.requestedStatus} onChange={(e) => set('requestedStatus', e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </Select>
          </Field>
        </div>
        {needsTimes && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in"><Input type="time" value={form.checkIn} onChange={(e) => set('checkIn', e.target.value)} /></Field>
            <Field label="Check-out"><Input type="time" value={form.checkOut} onChange={(e) => set('checkOut', e.target.value)} /></Field>
          </div>
        )}
        <Field label="Reason" required><Textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="e.g. Forgot to check out after a client visit…" required /></Field>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={saving}>Submit request</Button>
        </div>
      </form>
    </Modal>
  )
}
