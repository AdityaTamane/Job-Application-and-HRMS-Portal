import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Wallet as WalletIcon,
  Plus,
  ArrowDownToLine,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  RotateCcw,
  Banknote,
} from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { useT } from '@/lib/i18n'
import { getBalance, listTxns, addFunds, withdraw } from '@/lib/payments'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field, Input } from '@/components/ui/form'
import { StatCard, EmptyState } from '@/components/ui/misc'
import { toast } from '@/components/ui/toast'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'
import type { WalletTxn, WalletTxnKind } from '@/lib/types'

const TXN_META: Record<WalletTxnKind, { icon: typeof ArrowUpRight; tone: string; label: string }> = {
  topup: { icon: Plus, tone: 'text-emerald-600 dark:text-emerald-400', label: 'Top-up' },
  payout: { icon: ArrowDownLeft, tone: 'text-emerald-600 dark:text-emerald-400', label: 'Earnings payout' },
  refund: { icon: RotateCcw, tone: 'text-emerald-600 dark:text-emerald-400', label: 'Refund' },
  escrow_hold: { icon: ArrowUpRight, tone: 'text-slate-500 dark:text-slate-400', label: 'Booking payment' },
  withdrawal: { icon: ArrowDownToLine, tone: 'text-slate-500 dark:text-slate-400', label: 'Withdrawal' },
}

export function Wallet() {
  const { user } = useAuth()
  const t = useT()
  const [mode, setMode] = useState<'add' | 'withdraw' | null>(null)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)

  const balance = useLiveQuery(() => (user ? getBalance(user.id) : 0), [user?.id]) ?? 0
  const txns = useLiveQuery(() => (user ? listTxns(user.id) : []), [user?.id]) as WalletTxn[] | undefined
  // Money still held in escrow for this customer's active bookings.
  const inEscrow = useLiveQuery(async () => {
    if (!user) return 0
    const jobs = await db.jobs.where('customerId').equals(user.id).toArray()
    return jobs.filter((j) => j.paymentStatus === 'in_escrow').reduce((s, j) => s + (j.escrowAmount ?? 0), 0)
  }, [user?.id]) ?? 0

  const isStudent = user?.role === 'student'

  const submit = async () => {
    if (!user) return
    const value = Math.round(Number(amount))
    if (!value || value <= 0) return toast.error('Enter a valid amount')
    setBusy(true)
    try {
      if (mode === 'add') {
        await addFunds(user.id, value)
        toast.success('Money added', `${formatCurrency(value)} added to your wallet.`)
      } else {
        await withdraw(user.id, value)
        toast.success('Withdrawal requested', `${formatCurrency(value)} is on its way to your bank.`)
      }
      setMode(null)
      setAmount('')
    } catch (e) {
      toast.error('Failed', (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('wallet.title')}
        subtitle={isStudent ? 'Your earnings, top-ups and withdrawals.' : 'Your balance, payments and refunds.'}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setMode('add')}>
              {t('wallet.addFunds')}
            </Button>
            <Button size="sm" icon={<ArrowDownToLine className="h-4 w-4" />} onClick={() => setMode('withdraw')}>
              {t('wallet.withdraw')}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('wallet.balance')} value={formatCurrency(balance)} icon={<WalletIcon className="h-5 w-5" />} tone="brand" />
        {isStudent ? (
          <StatCard
            label="Lifetime payouts"
            value={formatCurrency((txns ?? []).filter((x) => x.kind === 'payout').reduce((s, x) => s + x.amount, 0))}
            icon={<Banknote className="h-5 w-5" />}
            tone="green"
          />
        ) : (
          <StatCard label={t('wallet.inEscrow')} value={formatCurrency(inEscrow)} icon={<ShieldCheck className="h-5 w-5" />} tone="amber" sub="Released when jobs complete" />
        )}
        <StatCard label="Transactions" value={txns?.length ?? 0} icon={<RotateCcw className="h-5 w-5" />} tone="purple" />
      </div>

      <div className="card mt-6 p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('wallet.history')}</h2>
        {!txns?.length ? (
          <EmptyState icon={<WalletIcon className="h-6 w-6" />} title={t('wallet.noTxns')} />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {txns.map((tx) => {
              const meta = TXN_META[tx.kind]
              const credit = tx.amount >= 0
              return (
                <li key={tx.id} className="flex items-center gap-3 py-3">
                  <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800', meta.tone)}>
                    <meta.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{tx.note}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{meta.label} · {formatDateTime(tx.createdAt)}</p>
                  </div>
                  <span className={cn('shrink-0 text-sm font-bold', credit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200')}>
                    {credit ? '+' : '−'}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Modal open={mode !== null} onClose={() => setMode(null)} title={mode === 'add' ? t('wallet.addFunds') : t('wallet.withdraw')} size="sm">
        <div className="space-y-4">
          <Field label="Amount (₹)" required>
            <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" autoFocus />
          </Field>
          {mode === 'add' && (
            <div className="flex flex-wrap gap-2">
              {[500, 1000, 2000, 5000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-brand-300 dark:border-slate-700 dark:text-slate-300"
                >
                  {formatCurrency(v)}
                </button>
              ))}
            </div>
          )}
          {mode === 'withdraw' && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Available: {formatCurrency(balance)}</p>
          )}
          <Button className="w-full" loading={busy} onClick={submit}>
            {mode === 'add' ? t('wallet.addFunds') : t('wallet.withdraw')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
