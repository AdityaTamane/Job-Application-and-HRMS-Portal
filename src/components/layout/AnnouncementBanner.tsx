import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Megaphone, X } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import type { AnnouncementAudience, Role } from '@/lib/types'
import { timeAgo } from '@/lib/utils'

const AUDIENCE_FOR_ROLE: Partial<Record<Role, AnnouncementAudience>> = {
  student: 'students',
  customer: 'customers',
  teacher: 'teachers',
}

const DISMISS_KEY = 'lighthouse:dismissed-announcements'
const readDismissed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? '[]')
  } catch {
    return []
  }
}

/**
 * Shows recent admin broadcasts relevant to the current user at the top of
 * their portal — so announcements aren't only buried in the notification bell.
 * Dismissals persist in localStorage; admins never see it.
 */
export function AnnouncementBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState<string[]>(readDismissed)
  const announcements = useLiveQuery(() => db.announcements.reverse().sortBy('createdAt'), [])

  if (!user || user.role === 'admin') return null

  const mine = (announcements ?? [])
    .filter((a) => a.audience === 'all' || a.audience === AUDIENCE_FOR_ROLE[user.role])
    .filter((a) => !dismissed.includes(a.id))
    .slice(0, 2)

  if (!mine.length) return null

  const dismiss = (id: string) => {
    const next = [...dismissed, id]
    setDismissed(next)
    localStorage.setItem(DISMISS_KEY, JSON.stringify(next))
  }

  return (
    <div className="mb-5 space-y-3">
      {mine.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10"
        >
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
            <Megaphone className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-900 dark:text-brand-100">{a.title}</p>
            <p className="mt-0.5 text-sm text-brand-800/90 dark:text-brand-200/90">{a.body}</p>
            <p className="mt-1 text-xs text-brand-600/70 dark:text-brand-300/70">Lighthouse · {timeAgo(a.createdAt)}</p>
          </div>
          <button
            onClick={() => dismiss(a.id)}
            aria-label="Dismiss announcement"
            className="shrink-0 rounded-lg p-1 text-brand-500 transition hover:bg-brand-100 dark:hover:bg-brand-500/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
