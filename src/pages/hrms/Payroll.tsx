import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Banknote, Play, CheckCheck, FileText } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { generatePayroll, setPayrollStatus, processAllPayroll } from '@/lib/hrms'
import type { PayrollRecord } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard, EmptyState } from '@/components/ui/misc'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusPill } from '@/components/ui/Badge'
import { Select } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'

function recentMonths(n: number) {
  const out: string[] = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return out
}

export function Payroll() {
  const { user } = useAuth()
  const months = useMemo(() => recentMonths(6), [])
  const [month, setMonth] = useState(months[0])
  const employees = useLiveQuery(() => db.employees.toArray(), [])
  const records = useLiveQuery(() => db.payroll.where('month').equals(month).toArray(), [month])
  const [busy, setBusy] = useState(false)

  const empName = useMemo(() => new Map((employees ?? []).map((e) => [e.id, e.name])), [employees])
  const admin = user ? { id: user.id, name: user.name } : { id: '', name: '' }

  const totals = useMemo(() => {
    const r = records ?? []
    return {
      net: r.reduce((s, x) => s + x.net, 0),
      paid: r.filter((x) => x.status === 'paid').length,
      count: r.length,
    }
  }, [records])

  const run = async () => {
    setBusy(true)
    try {
      const created = await generatePayroll(month, admin)
      toast.success(created ? `Generated ${created} payslips` : 'Already generated', month)
    } finally {
      setBusy(false)
    }
  }

  const markAllPaid = async () => {
    await processAllPayroll(month, 'paid', admin)
    toast.success('All payslips marked paid')
  }

  const cycleStatus = (r: PayrollRecord) => {
    const next = r.status === 'draft' ? 'processed' : r.status === 'processed' ? 'paid' : 'draft'
    setPayrollStatus(r, next, admin)
  }

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle="Generate and process monthly payslips"
        actions={
          <div className="flex items-center gap-2">
            <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-36">
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Button variant="outline" icon={<Play className="h-4 w-4" />} loading={busy} onClick={run}>Generate</Button>
          </div>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Payslips" value={totals.count} tone="brand" icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Total net" value={formatCurrency(totals.net)} tone="green" icon={<Banknote className="h-5 w-5" />} />
        <StatCard label="Paid" value={`${totals.paid}/${totals.count}`} tone="purple" icon={<CheckCheck className="h-5 w-5" />} />
      </div>

      {(records ?? []).length === 0 ? (
        <EmptyState
          icon={<Banknote className="h-7 w-7" />}
          title={`No payroll for ${month}`}
          description="Generate payslips for this month to get started."
          action={<Button icon={<Play className="h-4 w-4" />} loading={busy} onClick={run}>Generate payroll</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{month} · {totals.count} employees</p>
            <Button size="sm" variant="success" icon={<CheckCheck className="h-4 w-4" />} onClick={markAllPaid}>Mark all paid</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 text-right font-medium">Base</th>
                  <th className="px-4 py-3 text-right font-medium">Allowances</th>
                  <th className="px-4 py-3 text-right font-medium">Deductions</th>
                  <th className="px-4 py-3 text-right font-medium">Net pay</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records?.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={empName.get(r.employeeId) ?? '?'} size={32} />
                        <span className="font-medium text-slate-800 dark:text-slate-100">{empName.get(r.employeeId)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(r.base)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">+{formatCurrency(r.allowances)}</td>
                    <td className="px-4 py-3 text-right text-red-500">−{formatCurrency(r.deductions)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(r.net)}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => cycleStatus(r)} title="Click to advance status">
                        <StatusPill status={r.status} />
                      </button>
                    </td>
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
