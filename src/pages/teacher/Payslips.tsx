import { useLiveQuery } from 'dexie-react-hooks'
import { Banknote, Lock } from 'lucide-react'
import { db } from '@/lib/db'
import { useTeacherStatus } from '@/hooks/useTeacherStatus'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader, EmptyState, StatCard } from '@/components/ui/misc'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

export function Payslips() {
  const status = useTeacherStatus()
  const employee = status?.employee
  const payslips = useLiveQuery(
    () => (employee ? db.payroll.where('employeeId').equals(employee.id).toArray() : []),
    [employee?.id],
  )

  if (status === undefined) return <PageLoader />

  if (!employee) {
    return (
      <div>
        <PageHeader title="Payslips" subtitle="Your salary history" />
        <EmptyState
          icon={<Lock className="h-7 w-7" />}
          title="Payslips unlock once you're hired"
          description="When your application is accepted and you join the faculty, your monthly payslips will appear here."
        />
      </div>
    )
  }

  const rows = (payslips ?? []).slice().sort((a, b) => b.month.localeCompare(a.month))
  const paid = rows.filter((r) => r.status === 'paid')
  const ytdNet = paid.reduce((sum, r) => sum + r.net, 0)

  return (
    <div>
      <PageHeader title="Payslips" subtitle={`${employee.designation} · ${employee.department}`} />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Monthly gross" value={formatCurrency(employee.monthlySalary)} tone="brand" />
        <StatCard label="Payslips" value={rows.length} tone="purple" />
        <StatCard label="Total paid out" value={formatCurrency(ytdNet)} tone="green" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Banknote className="h-7 w-7" />} title="No payslips yet" description="Your first payslip will show up after the next payroll run." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Month</th>
                  <th className="px-4 py-3 text-right font-medium">Base</th>
                  <th className="px-4 py-3 text-right font-medium">Allowances</th>
                  <th className="px-4 py-3 text-right font-medium">Deductions</th>
                  <th className="px-4 py-3 text-right font-medium">Net pay</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{p.month}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(p.base)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">+{formatCurrency(p.allowances)}</td>
                    <td className="px-4 py-3 text-right text-red-500">−{formatCurrency(p.deductions)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(p.net)}</td>
                    <td className="px-4 py-3"><StatusPill status={p.status} /></td>
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
