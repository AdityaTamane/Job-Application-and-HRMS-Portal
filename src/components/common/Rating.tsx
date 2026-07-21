import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Rating({
  value,
  count,
  size = 14,
  interactive = false,
  onChange,
}: {
  value: number
  count?: number
  size?: number
  interactive?: boolean
  onChange?: (v: number) => void
}) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex">
        {stars.map((s) => (
          <button
            key={s}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(s)}
            className={cn(interactive && 'cursor-pointer transition hover:scale-110', !interactive && 'cursor-default')}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(s <= Math.round(value) ? 'fill-beacon-400 text-beacon-400' : 'fill-slate-200 text-slate-200')}
            />
          </button>
        ))}
      </div>
      {value > 0 && <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{value.toFixed(1)}</span>}
      {count !== undefined && count > 0 && <span className="text-xs text-slate-400 dark:text-slate-500">({count})</span>}
    </div>
  )
}
