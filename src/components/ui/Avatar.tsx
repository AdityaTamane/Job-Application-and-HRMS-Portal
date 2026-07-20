import { useState } from 'react'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/utils'

export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string
  name: string
  size?: number
  className?: string
}) {
  const [errored, setErrored] = useState(false)
  const showImg = src && !errored
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {showImg ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  )
}
