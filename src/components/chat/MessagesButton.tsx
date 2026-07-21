import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { summarizeThreads, type ChatParty, type ThreadSummary } from '@/lib/chat'
import { Avatar } from '@/components/ui/Avatar'
import { ChatModal } from './ChatModal'
import { cn, timeAgo } from '@/lib/utils'

export function MessagesButton() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<ThreadSummary | null>(null)

  const all = useLiveQuery(() => db.chat.toArray(), [])
  const threads = user ? summarizeThreads(all ?? [], user.id) : []
  const unread = threads.reduce((n, t) => n + t.unread, 0)

  if (!user) return null
  const me: ChatParty = { id: user.id, name: user.name, role: user.role }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Messages"
      >
        <MessageCircle className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 w-80 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <span className="text-sm font-semibold">Messages</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!threads.length && (
                <p className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">No conversations yet</p>
              )}
              {threads.map((t) => (
                <button
                  key={t.threadId}
                  onClick={() => {
                    setActive(t)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/60"
                >
                  <Avatar name={t.other.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{t.other.name}</p>
                      <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(t.lastAt)}</span>
                    </div>
                    <p className={cn('truncate text-xs', t.unread ? 'font-semibold text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400')}>
                      {t.lastText}
                    </p>
                  </div>
                  {t.unread > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                      {t.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {active && active.jobId && (
        <ChatModal
          open
          onClose={() => setActive(null)}
          me={me}
          other={active.other}
          jobId={active.jobId}
        />
      )}
    </div>
  )
}
