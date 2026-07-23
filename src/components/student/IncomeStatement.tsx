import { Printer, ShieldCheck } from 'lucide-react'
import type { Job, Student } from '@/lib/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'

/**
 * Printable income & work statement — an official-looking earnings proof a
 * student can save as PDF (via the browser print dialog) for loans, rentals,
 * or formal job applications.
 */
export function IncomeStatement({
  open, onClose, student, jobs,
}: {
  open: boolean
  onClose: () => void
  student: Student
  jobs: Job[]
}) {
  const sorted = [...jobs].sort((a, b) => a.scheduledAt - b.scheduledAt)
  const total = sorted.reduce((s, j) => s + j.estimatedPrice, 0)
  const avg = sorted.length ? Math.round(total / sorted.length) : 0
  const period = sorted.length
    ? `${formatDate(sorted[0].scheduledAt)} – ${formatDate(sorted[sorted.length - 1].scheduledAt)}`
    : '—'
  const generated = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const statementId = `LAW-${student.id.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8)}`

  return (
    <Modal open={open} onClose={onClose} title="Income & work statement" size="lg">
      <div className="print-area rounded-xl border border-slate-200 bg-white p-6 text-slate-900 sm:p-8">
        {/* Letterhead */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-lg font-extrabold tracking-tight text-brand-700">Lighthouse Academy Works</p>
            <p className="text-xs text-slate-500">Verified livelihoods · Bengaluru</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">Income &amp; Work Statement</p>
            <p className="text-xs text-slate-500">Ref: {statementId}</p>
            <p className="text-xs text-slate-500">Generated {generated}</p>
          </div>
        </div>

        {/* Subject */}
        <div className="mt-4 grid grid-cols-2 gap-y-1 text-sm">
          <p><span className="text-slate-500">Name:</span> <span className="font-semibold">{student.name}</span></p>
          <p><span className="text-slate-500">Batch:</span> {student.academyBatch}</p>
          <p><span className="text-slate-500">Email:</span> {student.email}</p>
          <p><span className="text-slate-500">Phone:</span> {student.phone}</p>
          <p><span className="text-slate-500">Status:</span> {student.verificationStatus === 'verified' ? 'Verified professional' : 'Registered'}</p>
          <p><span className="text-slate-500">Period:</span> {period}</p>
        </div>

        {/* Summary */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <SummaryTile label="Total earned" value={formatCurrency(total)} />
          <SummaryTile label="Jobs completed" value={String(sorted.length)} />
          <SummaryTile label="Average / job" value={formatCurrency(avg)} />
        </div>

        {/* Detail */}
        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Job</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((j) => (
              <tr key={j.id} className="border-b border-slate-100">
                <td className="py-2 text-slate-600">{formatDate(j.scheduledAt)}</td>
                <td className="py-2 font-medium text-slate-800">{j.title}</td>
                <td className="py-2 text-right font-semibold">{formatCurrency(j.estimatedPrice)}</td>
              </tr>
            ))}
            {!sorted.length && (
              <tr><td colSpan={3} className="py-6 text-center text-slate-400">No completed jobs yet.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300">
              <td className="py-2 font-bold" colSpan={2}>Total</td>
              <td className="py-2 text-right font-bold text-brand-700">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-6 flex items-start gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <p>
            This statement is a digitally generated record of work completed through the Lighthouse Academy Works
            marketplace. Figures reflect job values recorded on the platform. Reference {statementId}. No physical
            signature is required.
          </p>
        </div>
      </div>

      <div className="no-print mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Download / Print PDF</Button>
      </div>
    </Modal>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}
