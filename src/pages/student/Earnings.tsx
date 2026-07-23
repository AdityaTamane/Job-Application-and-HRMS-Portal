import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Wallet, TrendingUp, Briefcase, Receipt, FileDown } from 'lucide-react'
import { db } from '@/lib/db'
import { useStudent } from '@/hooks/useStudent'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader, StatCard, EmptyState } from '@/components/ui/misc'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { IncomeStatement } from '@/components/student/IncomeStatement'
import { formatCurrency, formatDate } from '@/lib/utils'

export function Earnings() {
  const student = useStudent()
  const [statementOpen, setStatementOpen] = useState(false)
  const completed = useLiveQuery(
    async () =>
      student
        ? (await db.jobs.where('studentId').equals(student.id).toArray())
            .filter((j) => j.status === 'completed')
            .sort((a, b) => b.scheduledAt - a.scheduledAt)
        : [],
    [student?.id],
  )

  const totals = useMemo(() => {
    const jobs = completed ?? []
    const total = jobs.reduce((s, j) => s + j.estimatedPrice, 0)
    const now = new Date()
    const thisMonth = jobs
      .filter((j) => {
        const d = new Date(j.scheduledAt)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((s, j) => s + j.estimatedPrice, 0)
    const avg = jobs.length ? Math.round(total / jobs.length) : 0
    return { total, thisMonth, avg, count: jobs.length }
  }, [completed])

  if (!student) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Earnings"
        subtitle="Your income from completed jobs"
        actions={
          <Button
            variant="outline"
            icon={<FileDown className="h-4 w-4" />}
            disabled={!completed?.length}
            onClick={() => setStatementOpen(true)}
          >
            Income statement
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total earned" value={formatCurrency(totals.total)} tone="green" icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="This month" value={formatCurrency(totals.thisMonth)} tone="brand" icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label="Jobs completed" value={totals.count} tone="purple" icon={<Briefcase className="h-5 w-5" />} />
        <StatCard label="Avg / job" value={formatCurrency(totals.avg)} tone="amber" icon={<Receipt className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader title="Payment history" subtitle={`${totals.count} completed jobs`} />
        <CardBody>
          {!completed?.length ? (
            <EmptyState icon={<Wallet className="h-6 w-6" />} title="No earnings yet" description="Complete your first job to start earning." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    <th className="pb-2 font-medium">Job</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((j) => (
                    <tr key={j.id} className="border-b border-slate-50">
                      <td className="py-3 font-medium text-slate-800 dark:text-slate-100">{j.title}</td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{formatDate(j.scheduledAt)}</td>
                      <td className="py-3 text-right font-semibold text-emerald-600">{formatCurrency(j.estimatedPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <IncomeStatement
        open={statementOpen}
        onClose={() => setStatementOpen(false)}
        student={student}
        jobs={completed ?? []}
      />
    </div>
  )
}
