import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CreditCard, Wallet as WalletIcon, Smartphone, ShieldCheck, Lock } from 'lucide-react'
import type { Job, PaymentMethod } from '@/lib/types'
import { getBalance, payForJob, validateCard } from '@/lib/payments'
import { useAuth } from '@/lib/auth'
import { useT } from '@/lib/i18n'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'
import { cn, formatCurrency } from '@/lib/utils'

const METHODS: { id: PaymentMethod; icon: typeof CreditCard; label: string }[] = [
  { id: 'card', icon: CreditCard, label: 'Card' },
  { id: 'upi', icon: Smartphone, label: 'UPI' },
  { id: 'wallet', icon: WalletIcon, label: 'Wallet' },
]

export function PaymentModal({
  open,
  onClose,
  job,
  onPaid,
}: {
  open: boolean
  onClose: () => void
  job: Job | null
  onPaid?: () => void
}) {
  const { user } = useAuth()
  const t = useT()
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [loading, setLoading] = useState(false)
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [upi, setUpi] = useState('')

  const balance = useLiveQuery(() => (user ? getBalance(user.id) : 0), [user?.id]) ?? 0
  if (!job) return null
  const amount = job.escrowAmount ?? job.estimatedPrice

  const pay = async () => {
    if (!user) return
    if (method === 'card') {
      const err = validateCard(card)
      if (err) return toast.error(err)
    }
    if (method === 'upi' && !/^[\w.-]+@[\w.-]+$/.test(upi)) {
      return toast.error('Enter a valid UPI ID (e.g. name@bank)')
    }
    if (method === 'wallet' && amount > balance) {
      return toast.error('Insufficient wallet balance', 'Add money or pick another method.')
    }
    setLoading(true)
    try {
      // Simulate gateway latency.
      await new Promise((r) => setTimeout(r, 900))
      await payForJob(job, method, { id: user.id, name: user.name })
      toast.success(t('pay.success'), `${formatCurrency(amount)} held in escrow.`)
      onPaid?.()
      onClose()
    } catch (e) {
      toast.error('Payment failed', (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('pay.title')} size="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{job.title}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('pay.total')}</p>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(amount)}</span>
        </div>

        {/* Method picker */}
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition',
                method === m.id
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400',
              )}
            >
              <m.icon className="h-5 w-5" />
              {m.id === 'wallet' ? t('wallet.title') : m.label}
            </button>
          ))}
        </div>

        {method === 'card' && (
          <div className="space-y-3">
            <Field label={t('pay.cardNumber')} required>
              <Input
                inputMode="numeric"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: e.target.value })}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('pay.expiry')} required>
                <Input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} placeholder="MM/YY" maxLength={5} />
              </Field>
              <Field label={t('pay.cvv')} required>
                <Input inputMode="numeric" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} placeholder="123" maxLength={3} />
              </Field>
            </div>
            <Field label={t('pay.nameOnCard')}>
              <Input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Anita Rao" />
            </Field>
          </div>
        )}

        {method === 'upi' && (
          <Field label="UPI ID" required>
            <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@okbank" />
          </Field>
        )}

        {method === 'wallet' && (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
            <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <WalletIcon className="h-4 w-4" /> {t('wallet.balance')}
            </span>
            <span className={cn('text-sm font-bold', amount > balance ? 'text-red-500' : 'text-slate-900 dark:text-slate-100')}>
              {formatCurrency(balance)}
            </span>
          </div>
        )}

        <p className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> {t('pay.escrowNote')}
        </p>

        <Button className="w-full" loading={loading} onClick={pay} icon={<Lock className="h-4 w-4" />}>
          {loading ? t('pay.processing') : `${t('pay.payNow')} · ${formatCurrency(amount)}`}
        </Button>
      </div>
    </Modal>
  )
}
