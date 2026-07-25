import { useLiveQuery } from 'dexie-react-hooks'
import { Phone } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { useCall } from './CallProvider'
import type { Job } from '@/lib/types'
import { Button } from '@/components/ui/Button'

/**
 * Contextual voice-call button for a booking. Resolves the counterparty from
 * the job (customer ↔ the assigned pro's user account) and rings them.
 */
export function CallButton({
  job,
  size = 'sm',
  variant = 'outline',
  label,
  iconOnly = false,
}: {
  job: Job
  size?: 'sm' | 'md' | 'icon'
  variant?: 'outline' | 'ghost' | 'secondary'
  label?: string
  iconOnly?: boolean
}) {
  const { user } = useAuth()
  const { startCall, inCall } = useCall()

  const other = useLiveQuery(async () => {
    if (!user) return null
    if (user.role === 'customer') {
      if (!job.studentId) return null
      const s = await db.students.get(job.studentId)
      return s ? { id: s.userId, name: s.name } : null
    }
    const c = await db.users.get(job.customerId)
    return c ? { id: c.id, name: c.name } : null
  }, [user?.id, job.studentId, job.customerId])

  if (!user || !other) return null

  return (
    <Button
      size={size}
      variant={variant}
      disabled={inCall}
      icon={<Phone className="h-4 w-4" />}
      onClick={() => startCall(other, job.id)}
      aria-label={`Call ${other.name}`}
      title={`Call ${other.name}`}
    >
      {!iconOnly && (label ?? 'Call')}
    </Button>
  )
}
