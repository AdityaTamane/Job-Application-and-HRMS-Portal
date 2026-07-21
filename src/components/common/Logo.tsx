import { cn } from '@/lib/utils'

/** Lighthouse mark — a stylised beacon. */
export function Logo({ size = 32, withText = true, className }: { size?: number; withText?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Lighthouse">
        <rect width="48" height="48" rx="12" fill="#17325b" />
        {/* beam */}
        <path d="M24 16 L40 10 L40 14 L24 20 Z" fill="#f7a825" opacity="0.85" />
        <path d="M24 16 L8 10 L8 14 L24 20 Z" fill="#f7a825" opacity="0.55" />
        {/* tower */}
        <path d="M20 20 L28 20 L30 38 L18 38 Z" fill="#ffffff" />
        <rect x="21" y="24" width="6" height="4" rx="1" fill="#2f63ad" />
        <circle cx="24" cy="15" r="3.5" fill="#f9c04f" />
        <rect x="16" y="38" width="16" height="3" rx="1.5" fill="#adc9ea" />
      </svg>
      {withText && (
        <div className="leading-tight">
          <span className="gradient-text block text-[15px] font-extrabold tracking-tight">Lighthouse</span>
          <span className="block text-[10px] font-medium uppercase tracking-wider text-beacon-600 dark:text-beacon-400">Academy Works</span>
        </div>
      )}
    </div>
  )
}
