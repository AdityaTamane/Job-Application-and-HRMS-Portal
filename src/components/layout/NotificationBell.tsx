import { useState } from 'react'
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
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 w-80 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs font-medium text-brand-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!notifications?.length && <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p>}
              {notifications?.map((n) => (
                <div key={n.id} className={cn('border-b border-slate-50 px-4 py-3', !n.read && 'bg-brand-50/40')}>
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
