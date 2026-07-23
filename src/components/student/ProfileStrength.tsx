import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, TrendingUp } from 'lucide-react'
import type { Student } from '@/lib/types'
import { computeProfileStrength } from '@/lib/profileStrength'
import { Card, CardBody } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

const RING: Record<'red' | 'amber' | 'green', string> = {
  red: 'text-red-500',
  amber: 'text-beacon-500',
  green: 'text-emerald-500',
}

/**
 * Profile-strength gauge + coaching checklist. `compact` renders a small
 * dashboard nudge that links to the full profile; otherwise the full checklist.
 */
export function ProfileStrength({ student, compact = false }: { student: Student; compact?: boolean }) {
  const { score, items, tone, label } = computeProfileStrength(student)
  const unmet = items.filter((i) => !i.met)
  const circumference = 2 * Math.PI * 26

  const gauge = (
    <div className="relative grid h-20 w-20 shrink-0 place-items-center">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="26" fill="none" strokeWidth="6" className="stroke-slate-100 dark:stroke-slate-800" />
        <circle
          cx="30" cy="30" r="26" fill="none" strokeWidth="6" strokeLinecap="round"
          className={cn('transition-all duration-500', RING[tone])}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          stroke="currentColor"
        />
      </svg>
      <span className="absolute text-lg font-bold text-slate-900 dark:text-slate-100">{score}%</span>
    </div>
  )

  if (compact) {
    return (
      <Card>
        <CardBody className="flex items-center gap-4">
          {gauge}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <TrendingUp className="h-4 w-4 text-brand-500" /> Profile strength
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {unmet.length ? `${unmet[0].tip}` : 'Your profile is fully optimised 🎉'}
            </p>
            <Link to="/student/profile" className="mt-1 inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-300">
              {unmet.length ? `Improve profile (${unmet.length} left)` : 'View profile'} →
            </Link>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-4">
          {gauge}
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Profile strength</p>
            <p className={cn('text-sm font-medium', RING[tone])}>{label}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">A stronger profile ranks higher and wins more jobs.</p>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {items.map((i) => (
            <li key={i.key} className="flex items-start gap-2 text-sm">
              {i.met
                ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />}
              <span className={cn('flex-1', i.met ? 'text-slate-400 line-through dark:text-slate-600' : 'text-slate-700 dark:text-slate-200')}>
                {i.met ? i.label : i.tip}
              </span>
              {!i.met && <span className="shrink-0 text-xs font-medium text-slate-400 dark:text-slate-500">+{i.weight}%</span>}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}
