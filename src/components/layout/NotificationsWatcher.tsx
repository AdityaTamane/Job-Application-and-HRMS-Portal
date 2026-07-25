import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { toast } from '@/components/ui/toast'
import { showBrowserNotification, playChime, soundEnabled } from '@/lib/push'
import type { Notification } from '@/lib/types'

const TOAST_FOR: Record<Notification['type'], 'success' | 'info' | 'warning'> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  action: 'info',
}

/**
 * Headless component: watches the signed-in user's notifications and, for each
 * genuinely new one, fires an in-app toast, an audible chime, and an OS push
 * notification (when the tab is backgrounded and permission is granted).
 *
 * On mount it baselines the current set as "already seen" so historical
 * notifications don't replay — only rows that arrive afterwards fire. Dexie's
 * liveQuery observes writes from other tabs too, so a notification created in
 * one tab surfaces in all of them.
 */
export function NotificationsWatcher() {
  const { user } = useAuth()
  const seen = useRef<Set<string> | null>(null)

  // Reset the baseline whenever the active user changes.
  useEffect(() => {
    seen.current = null
  }, [user?.id])

  const notifications = useLiveQuery(
    () => (user ? db.notifications.where('userId').equals(user.id).toArray() : []),
    [user?.id],
  )

  useEffect(() => {
    if (!notifications) return
    if (seen.current === null) {
      seen.current = new Set(notifications.map((n) => n.id))
      return
    }
    // Newest first so a burst chimes/toasts in a sensible order.
    const fresh = notifications
      .filter((n) => !seen.current!.has(n.id))
      .sort((a, b) => a.createdAt - b.createdAt)
    if (!fresh.length) return
    for (const n of fresh) {
      seen.current!.add(n.id)
      toast[TOAST_FOR[n.type]](n.title, n.body)
      showBrowserNotification(n.title, n.body, n.id)
    }
    if (soundEnabled()) playChime()
  }, [notifications])

  return null
}
