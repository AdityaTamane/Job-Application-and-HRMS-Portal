import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { Users, UserCheck, CalendarOff, Banknote, ArrowRight, CheckCircle2, Home, XCircle, Clock } from 'lucide-react'
import { db } from '@/lib/db'
import { todayStr } from '@/lib/hrms'
import type { AttendanceStatus } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/misc'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusPill } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

// Single brand hue for magnitude bars.
const BAR_HUE = '#2f63ad'
// Status palette (reserved) — always shown with labels/legend, never colour alone.
const ATT_STATUS: { key: AttendanceStatus; label: string; color: string; icon: typeof CheckCircle2 }[] = [
  { key: 'present', label: 'Present', color: '#10b981', icon: CheckCircle2 },
  { key: 'wfh', label: 'WFH', color: '#2f63ad', icon: Home },
  { key: 'leave', label: 'On leave', color: '#f18f0c', icon: Clock },
  { key: 'absent', label: 'Absent', color: '#ef4444', icon: XCircle },
]

export function HrmsDashboard() {
  const employees = useLiveQuery(() => db.employees.toArray(), [])
  const attendance = useLiveQuery(() => db.attendance.where('date').equals(todayStr()).toArray(), [])
  const leaves = useLiveQuery(() => db.leaves.toArray(), [])

  const active = (employees ?? []).filter((e) => e.status !== 'terminated')

  const deptData = useMemo(() => {
    const m = new Map<string, number>()
    active.forEach((e) => m.set(e.department, (m.get(e.department) ?? 0) + 1))
    return Array.from(m, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [active])

  const attData = useMemo(() => {
    const m = new Map<AttendanceStatus, number>()
    ;(attendance ?? []).forEach((a) => m.set(a.status, (m.get(a.status) ?? 0) + 1))
    return ATT_STATUS.map((s) => ({ ...s, value: m.get(s.key) ?? 0 })).filter((s) => s.value > 0)
  }, [attendance])

  const pendingLeaves = (leaves ?? []).filter((l) => l.status === 'pending')
  const presentToday = (attendance ?? []).filter((a) => a.status === 'present' || a.status === 'wfh').length
  const onLeave = active.filter((e) => e.status === 'on_leave').length
  const monthlyCost = active.reduce((s, e) => s + e.monthlySalary, 0)
  const empName = new Map((employees ?? []).map((e) => [e.id, e.name]))

  return (
    <div>
      <PageHeader title="HRMS Dashboard" subtitle="People operations at Lighthouse Academy" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Employees" value={active.length} tone="brand" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Present today" value={presentToday} tone="green" icon={<UserCheck className="h-5 w-5" />} />
        <StatCard label="On leave" value={onLeave} tone="amber" icon={<CalendarOff className="h-5 w-5" />} />
        <StatCard label="Monthly payroll" value={formatCurrency(monthlyCost)} tone="purple" icon={<Banknote className="h-5 w-5" />} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Department headcount — single-hue magnitude bars */}
        <Card>
          <CardHeader title="Headcount by department" />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} stroke="#eef2f7" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="count" fill={BAR_HUE} radius={[0, 4, 4, 0]} barSize={22}>
                  <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Attendance today — status donut with labelled legend */}
        <Card>
          <CardHeader title="Attendance today" subtitle={todayStr()} />
          <CardBody>
            {attData.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-400">No attendance marked yet today.</p>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie data={attData} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="#fff" strokeWidth={2}>
                      {attData.map((s) => <Cell key={s.key} fill={s.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {attData.map((s) => (
                    <div key={s.key} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      <s.icon className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-600">{s.label}</span>
                      <span className="font-semibold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Pending leaves */}
      <Card>
        <CardHeader
          title="Pending leave approvals"
          action={<Link to="/hrms/leaves"><Button variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />}>All leaves</Button></Link>}
        />
        <CardBody className="space-y-2">
          {pendingLeaves.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No pending requests 🎉</p>
          ) : (
            pendingLeaves.map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <Avatar name={empName.get(l.employeeId) ?? '?'} size={38} />
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{empName.get(l.employeeId)}</p>
                  <p className="text-xs text-slate-500 capitalize">{l.type} leave · {l.from}{l.to !== l.from ? ` → ${l.to}` : ''}</p>
                </div>
                <StatusPill status={l.status} />
                <Link to="/hrms/leaves"><Button size="sm" variant="outline">Review</Button></Link>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  )
}
