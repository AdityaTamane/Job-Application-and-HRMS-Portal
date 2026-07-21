import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info, Sparkles } from 'lucide-react'
import type { AttritionRisk, CategoryDemand, FunnelStage, Insight, RiskLevel } from '@/lib/analytics'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const TONE: Record<Insight['tone'], string> = {
  brand: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  amber: 'border-beacon-200 bg-beacon-50 text-beacon-800 dark:border-beacon-500/30 dark:bg-beacon-400/10 dark:text-beacon-200',
  red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
  purple: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-200',
}

function InsightIcon({ icon }: { icon: Insight['icon'] }) {
  const cls = 'h-5 w-5 shrink-0'
  if (icon === 'trend-up') return <TrendingUp className={cls} />
  if (icon === 'trend-down') return <TrendingDown className={cls} />
  if (icon === 'alert') return <AlertTriangle className={cls} />
  if (icon === 'check') return <CheckCircle2 className={cls} />
  return <Info className={cls} />
}

export function InsightCards({ insights }: { insights: Insight[] }) {
  if (!insights.length) return null
  return (
    <div className="mb-6">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Sparkles className="h-4 w-4 text-beacon-500" /> AI Insights
        <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium normal-case text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          computed on-device
        </span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {insights.map((it) => (
          <div key={it.id} className={cn('rounded-2xl border p-4', TONE[it.tone])}>
            <div className="flex items-start gap-2.5">
              <InsightIcon icon={it.icon} />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug">{it.title}</p>
                <p className="mt-1 text-xs opacity-80">{it.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DemandForecastCard({ demand }: { demand: CategoryDemand[] }) {
  const top = demand.slice(0, 6)
  const max = Math.max(1, ...top.map((d) => Math.max(d.thisWeek, d.forecastNext)))
  return (
    <Card>
      <CardHeader title="Demand forecast" subtitle="This week vs. projected next week, by service" />
      <CardBody className="space-y-3">
        {top.every((d) => d.total === 0) ? (
          <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">Not enough booking data yet.</p>
        ) : (
          top.map((d) => (
            <div key={d.categoryId}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">{d.name}</span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 dark:text-slate-500">next ~{d.forecastNext}</span>
                  <TrendBadge pct={d.changePct} />
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${(d.thisWeek / max) * 100}%` }} />
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-beacon-400" style={{ width: `${(d.forecastNext / max) * 100}%` }} />
                </div>
              </div>
            </div>
          ))
        )}
        <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-500" /> this week</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-beacon-400" /> forecast</span>
        </div>
      </CardBody>
    </Card>
  )
}

function TrendBadge({ pct }: { pct: number }) {
  if (pct === 0) return <span className="text-slate-400 dark:text-slate-500">flat</span>
  const up = pct > 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-semibold', up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct)}%
    </span>
  )
}

export function VerificationFunnelCard({ stages }: { stages: FunnelStage[] }) {
  const top = stages[0]?.count || 1
  return (
    <Card>
      <CardHeader title="Verification funnel" subtitle="Where students drop off on the way to verified" />
      <CardBody className="space-y-3">
        {stages.map((s, i) => (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">{s.label}</span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-100">{s.count}</span>
                {i > 0 && s.dropFromPrev > 0 && (
                  <span className="text-xs font-medium text-red-500">−{s.dropFromPrev}%</span>
                )}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={cn('h-full rounded-full', i === stages.length - 1 ? 'bg-emerald-500' : 'bg-brand-500')}
                style={{ width: `${(s.count / top) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}

const RISK_TONE: Record<RiskLevel, string> = {
  high: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  medium: 'bg-beacon-50 text-beacon-800 dark:bg-beacon-400/15 dark:text-beacon-200',
  low: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
}
const RISK_BAR: Record<RiskLevel, string> = { high: 'bg-red-500', medium: 'bg-beacon-500', low: 'bg-emerald-500' }

export function AttritionCard({ risks }: { risks: AttritionRisk[] }) {
  const flagged = risks.filter((r) => r.level !== 'low').slice(0, 6)
  return (
    <Card>
      <CardHeader
        title="Attrition risk radar"
        subtitle="Predicted flight risk from leave, attendance & tenure signals"
        action={<AlertTriangle className="h-4 w-4 text-slate-300 dark:text-slate-600" />}
      />
      <CardBody className="space-y-3">
        {flagged.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No elevated attrition risk 🎉</p>
        ) : (
          flagged.map((r) => (
            <div key={r.employee.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
              <Avatar name={r.employee.name} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-slate-800 dark:text-slate-100">{r.employee.name}</p>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', RISK_TONE[r.level])}>
                    {r.level}
                  </span>
                </div>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {r.employee.designation} · {r.reasons.slice(0, 2).join(' · ')}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={cn('h-full rounded-full', RISK_BAR[r.level])} style={{ width: `${r.score}%` }} />
                </div>
              </div>
              <span className="shrink-0 text-sm font-bold text-slate-700 dark:text-slate-200">{r.score}</span>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  )
}
