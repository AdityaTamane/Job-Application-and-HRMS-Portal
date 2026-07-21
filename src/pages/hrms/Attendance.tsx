import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { LogIn, LogOut, CalendarClock } from 'lucide-react'
import { db } from '@/lib/db'
import { checkIn, checkOut, setAttendanceStatus, todayStr } from '@/lib/hrms'
import type { Attendance as Att, AttendanceStatus } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/misc'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusPill } from '@/components/ui/Badge'
import { Select } from '@/components/ui/form'

const STATUSES: AttendanceStatus[] = ['present', 'wfh', 'leave', 'absent']

export function Attendance() {
  const employees = useLiveQuery(() => db.employees.where('status').notEqual('terminated').toArray(), [])
  const today = todayStr()
  const attendance = useLiveQuery(() => db.attendance.where('date').equals(today).toArray(), [today])

  const attMap = useMemo(() => new Map<string, Att>((attendance ?? []).map((a) => [a.employeeId, a])), [attendance])

  const present = (attendance ?? []).filter((a) => a.status === 'present' || a.status === 'wfh').length
  const onLeave = (attendance ?? []).filter((a) => a.status === 'leave').length
  const absent = (employees ?? []).length - (attendance ?? []).filter((a) => a.status !== 'absent').length

  return (
    <div>
      <PageHeader title="Attendance" subtitle={`Today · ${today}`} />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Present / WFH" value={present} tone="green" />
        <StatCard label="On leave" value={onLeave} tone="amber" />
        <StatCard label="Not marked in" value={Math.max(0, absent)} tone="red" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
              {employees?.map((e) => {
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
                        onChange={(ev) => setAttendanceStatus(e.id, today, ev.target.value as AttendanceStatus)}
                        className="h-8 w-28 py-1 text-xs"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                      </Select>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{att?.checkIn ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{att?.checkOut ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" icon={<LogIn className="h-3.5 w-3.5" />} disabled={!!att?.checkIn} onClick={() => checkIn(e)}>In</Button>
                        <Button size="sm" variant="outline" icon={<LogOut className="h-3.5 w-3.5" />} disabled={!att?.checkIn || !!att?.checkOut} onClick={() => checkOut(e)}>Out</Button>
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
        <CalendarClock className="h-3.5 w-3.5" /> <StatusPill status="present" /> counts toward payroll working days.
      </p>
    </div>
  )
}
