import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Send } from 'lucide-react'
import { db } from '@/lib/db'
import {
  broadcast,
  markThreadRead,
  onChatEvent,
  sendMessage,
  threadIdForJob,
  type ChatParty,
} from '@/lib/chat'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

export function ChatModal({
  open,
  onClose,
  me,
  other,
  jobId,
  jobTitle,
}: {
  open: boolean
  onClose: () => void
  me: ChatParty
  other: ChatParty
  jobId: string
  jobTitle?: string
}) {
  const threadId = threadIdForJob(jobId)
  const messages = useLiveQuery(
    () => (open ? db.chat.where('threadId').equals(threadId).sortBy('createdAt') : []),
    [threadId, open],
  )
  const [text, setText] = useState('')
  const [otherTyping, setOtherTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSent = useRef(0)

  // Mark read whenever the thread is open and messages change.
  useEffect(() => {
    if (open) markThreadRead(threadId, me.id)
  }, [open, threadId, me.id, messages])

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, otherTyping])

  // Listen for the other party's typing + incoming messages on this thread.
  useEffect(() => {
    if (!open) return
    return onChatEvent((ev) => {
      if (ev.kind === 'typing' && ev.threadId === threadId && ev.from === other.id) {
        setOtherTyping(true)
        if (typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setOtherTyping(false), 1600)
      }
      if (ev.kind === 'message' && ev.threadId === threadId && ev.to === me.id) {
        markThreadRead(threadId, me.id)
      }
    })
  }, [open, threadId, other.id, me.id])

  const handleType = (v: string) => {
    setText(v)
    const now = performance.now()
    if (now - lastTypingSent.current > 800) {
      lastTypingSent.current = now
      broadcast({ kind: 'typing', threadId, from: me.id, name: me.name })
    }
  }

  const send = async () => {
    const body = text
    setText('')
    await sendMessage(me, other, jobId, body)
  }

  return (
    <Modal open={open} onClose={onClose} title={
      <span className="flex items-center gap-2">
        <Avatar name={other.name} size={28} />
        <span>
          {other.name}
          <span className="ml-1 text-xs font-normal capitalize text-slate-400 dark:text-slate-500">· {other.role}</span>
        </span>
      </span>
    } size="md">
      <div className="flex h-[60vh] flex-col">
        {jobTitle && (
          <p className="mb-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Re: {jobTitle}
          </p>
        )}
        <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-0.5 py-2">
          {!messages?.length && (
            <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
              No messages yet — say hello 👋
            </p>
          )}
          {messages?.map((m) => {
            const mine = m.senderId === me.id
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                    mine
                      ? 'rounded-br-sm bg-brand-600 text-white'
                      : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={cn('mt-0.5 text-[10px]', mine ? 'text-brand-100' : 'text-slate-400 dark:text-slate-500')}>
                    {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {mine && (m.readAt ? ' · Read' : ' · Sent')}
                  </p>
                </div>
              </div>
            )
          })}
          {otherTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 dark:bg-slate-800">
                <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
              </div>
            </div>
          )}
        </div>

        <form
          className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <input
            className="input"
            placeholder={`Message ${other.name.split(' ')[0]}…`}
            value={text}
            onChange={(e) => handleType(e.target.value)}
            aria-label="Message"
            autoFocus
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Send message"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </Modal>
  )
}

function Dot({ delay = '0s' }: { delay?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500"
      style={{ animationDelay: delay }}
    />
  )
}
