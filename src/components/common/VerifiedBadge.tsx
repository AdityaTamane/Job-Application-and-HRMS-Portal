import { BadgeCheck, ShieldCheck, Crown } from 'lucide-react'
import type { BadgeTier } from '@/lib/types'
import { cn } from '@/lib/utils'

const CONFIG: Record<Exclude<BadgeTier, 'none'>, { label: string; icon: typeof BadgeCheck; cls: string }> = {
  basic: { label: 'Basic Verified', icon: BadgeCheck, cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
  verified: { label: 'Verified', icon: ShieldCheck, cls: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' },
  premium: { label: 'Premium Verified', icon: Crown, cls: 'bg-beacon-50 text-beacon-700 ring-1 ring-beacon-300' },
}

export function VerifiedBadge({
  tier,
  showLabel = true,
  size = 'md',
}: {
  tier: BadgeTier
  showLabel?: boolean
  size?: 'sm' | 'md'
}) {
  if (tier === 'none') return null
  const cfg = CONFIG[tier]
  const Icon = cfg.icon
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  if (!showLabel) {
    return (
      <span title={cfg.label} className={cn('inline-flex items-center justify-center rounded-full p-1', cfg.cls)}>
        <Icon className={iconSize} />
      </span>
    )
  }
  return (
    <span
      title={cfg.label}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        cfg.cls,
      )}
    >
      <Icon className={iconSize} />
      {cfg.label}
    </span>
  )
}
