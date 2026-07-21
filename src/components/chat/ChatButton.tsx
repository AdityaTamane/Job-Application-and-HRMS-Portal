import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { MessageCircle } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { threadIdForJob, type ChatParty } from '@/lib/chat'
import type { Job } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { ChatModal } from './ChatModal'

/**
 * Contextual "Message" button for a booking. Resolves the counterparty from the
 * job (customer ↔ the assigned student's user account) and opens the thread.
 */
export function ChatButton({
  job,
  size = 'sm',
  variant = 'outline',
  label = 'Message',
}: {
  job: Job
  size?: 'sm' | 'md'
  variant?: 'outline' | 'ghost' | 'secondary'
  label?: string
}) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const other = useLiveQuery(async (): Promise<ChatParty | null> => {
    if (!user) return null
    if (user.role === 'customer') {
      if (!job.studentId) return null
      const s = await db.students.get(job.studentId)
      return s ? { id: s.userId, name: s.name, role: 'student' } : null
    }
    // student (or admin) messaging the customer
    const c = await db.users.get(job.customerId)
    return c ? { id: c.id, name: c.name, role: 'customer' } : null
  }, [user?.id, job.studentId, job.customerId])

  // Unread count for this specific thread.
  const unread = useLiveQuery(async () => {
    if (!user) return 0
    const msgs = await db.chat.where('threadId').equals(threadIdForJob(job.id)).toArray()
    return msgs.filter((m) => m.recipientId === user.id && !m.readAt).length
  }, [user?.id, job.id])

  if (!user || !other) return null
  const me: ChatParty = { id: user.id, name: user.name, role: user.role }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        icon={<MessageCircle className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        {label}
        {!!unread && (
          <span className="ml-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </Button>
      {open && (
        <ChatModal open onClose={() => setOpen(false)} me={me} other={other} jobId={job.id} jobTitle={job.title} />
      )}
    </>
  )
}
