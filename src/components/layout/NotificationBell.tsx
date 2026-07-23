import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { cn, timeAgo } from '@/lib/utils'
import type { Notification } from '@/lib/types'

export function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const notifications = useLiveQuery(async () => {
    if (!user) return [] as Notification[]
    return db.notifications.where('userId').equals(user.id).reverse().sortBy('createdAt')
  }, [user?.id])
  const unread = notifications?.filter((n) => !n.read).length ?? 0

  const markAll = async () => {
    if (!user) return
    const ids = notifications?.filter((n) => !n.read).map((n) => n.id) ?? []
    await Promise.all(ids.map((id) => db.notifications.update(id, { read: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && createPortal(
        <>
          <div
            className="fixed inset-0 z-40 bg-brand-950/40 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift dark:border-slate-800 dark:bg-slate-900 sm:left-auto sm:right-4 sm:top-16 sm:w-80 sm:max-w-none sm:translate-x-0 sm:translate-y-0">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs font-medium text-brand-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[70vh] overflow-y-auto sm:max-h-96">
              {!notifications?.length && <p className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">No notifications</p>}
              {notifications?.map((n) => (
                <div key={n.id} className={cn('border-b border-slate-50 px-4 py-3 dark:border-slate-800/60', !n.read && 'bg-brand-50/40 dark:bg-brand-500/10')}>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{n.body}</p>
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}
