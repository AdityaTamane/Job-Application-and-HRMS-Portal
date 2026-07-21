import { type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-500', className)} />
}

export function PageLoader() {
  return (
    <div className="flex h-full min-h-[40vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40">
      {icon && <div className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-400 dark:bg-slate-800 dark:text-slate-500">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  sub,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  tone?: 'brand' | 'green' | 'amber' | 'purple' | 'red'
  sub?: ReactNode
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber: 'bg-beacon-50 text-beacon-600 dark:bg-beacon-400/15 dark:text-beacon-300',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  }
  const glow = {
    brand: 'before:bg-brand-400/10',
    green: 'before:bg-emerald-400/10',
    amber: 'before:bg-beacon-400/10',
    purple: 'before:bg-purple-400/10',
    red: 'before:bg-red-400/10',
  }
  return (
    <div
      className={cn(
        'card relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        "before:pointer-events-none before:absolute before:-right-6 before:-top-6 before:h-24 before:w-24 before:rounded-full before:blur-2xl before:content-['']",
        glow[tone],
      )}
    >
      <div className="relative flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {icon && <div className={cn('rounded-xl p-2.5 shadow-sm', tones[tone])}>{icon}</div>}
      </div>
      <p className="relative mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {sub && <p className="relative mt-1 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  )
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition',
            active === t.id
              ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-200'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cn('rounded-full px-1.5 text-xs', active === t.id ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400')}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
