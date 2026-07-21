// ---------------------------------------------------------------------------
// In-app chat (feature #5). Messages persist in IndexedDB (Dexie) and are
// delivered live across browser tabs/windows via BroadcastChannel — no server.
// Dexie's liveQuery reacts to writes within a tab; the channel adds instant
// cross-tab pings plus ephemeral "typing…" signals that we don't persist.
// ---------------------------------------------------------------------------

import { db, notify } from './db'
import { uid } from './utils'
import type { ChatMessage, Role } from './types'

export function threadIdForJob(jobId: string) {
  return `job:${jobId}`
}

export interface ChatParty {
  id: string // user id
  name: string
  role: Role
}

// --- BroadcastChannel (guarded for older browsers) --------------------------

type ChatEvent =
  | { kind: 'message'; threadId: string; to: string }
  | { kind: 'typing'; threadId: string; from: string; name: string }
  | { kind: 'read'; threadId: string; by: string }

let channel: BroadcastChannel | null = null
export function chatChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) channel = new BroadcastChannel('lighthouse-chat')
  return channel
}

export function broadcast(ev: ChatEvent) {
  chatChannel()?.postMessage(ev)
}

export function onChatEvent(handler: (ev: ChatEvent) => void): () => void {
  const ch = chatChannel()
  if (!ch) return () => {}
  const listener = (e: MessageEvent) => handler(e.data as ChatEvent)
  ch.addEventListener('message', listener)
  return () => ch.removeEventListener('message', listener)
}

// --- Actions ----------------------------------------------------------------

export async function sendMessage(
  me: ChatParty,
  recipient: ChatParty,
  jobId: string,
  text: string,
): Promise<ChatMessage | null> {
  const body = text.trim()
  if (!body) return null
  const threadId = threadIdForJob(jobId)
  const msg: ChatMessage = {
    id: uid('msg'),
    threadId,
    jobId,
    senderId: me.id,
    senderName: me.name,
    senderRole: me.role,
    recipientId: recipient.id,
    recipientName: recipient.name,
    text: body,
    createdAt: Date.now(),
  }
  await db.chat.add(msg)
  broadcast({ kind: 'message', threadId, to: recipient.id })
  await notify(recipient.id, `New message from ${me.name}`, body.slice(0, 80), 'info')
  return msg
}

export async function markThreadRead(threadId: string, myUserId: string) {
  const unread = await db.chat
    .where('threadId')
    .equals(threadId)
    .and((m) => m.recipientId === myUserId && !m.readAt)
    .toArray()
  if (!unread.length) return
  const now = Date.now()
  await Promise.all(unread.map((m) => db.chat.update(m.id, { readAt: now })))
  broadcast({ kind: 'read', threadId, by: myUserId })
}

export interface ThreadSummary {
  threadId: string
  jobId?: string
  other: { id: string; name: string; role: Role }
  lastText: string
  lastAt: number
  unread: number
}

/** Group all of a user's messages into per-thread summaries, newest first. */
export function summarizeThreads(messages: ChatMessage[], myUserId: string): ThreadSummary[] {
  const byThread = new Map<string, ChatMessage[]>()
  for (const m of messages) {
    if (m.senderId !== myUserId && m.recipientId !== myUserId) continue
    const arr = byThread.get(m.threadId) ?? []
    arr.push(m)
    byThread.set(m.threadId, arr)
  }
  const out: ThreadSummary[] = []
  for (const [threadId, msgs] of byThread) {
    msgs.sort((a, b) => a.createdAt - b.createdAt)
    const last = msgs[msgs.length - 1]
    // The "other" party is whoever isn't me on any message.
    const fromThem = msgs.find((m) => m.senderId !== myUserId)
    const toThem = msgs.find((m) => m.recipientId !== myUserId)
    const other = fromThem
      ? { id: fromThem.senderId, name: fromThem.senderName, role: fromThem.senderRole }
      : toThem
        ? { id: toThem.recipientId, name: toThem.recipientName, role: 'customer' as Role }
        : { id: '', name: 'Conversation', role: 'customer' as Role }
    out.push({
      threadId,
      jobId: last.jobId,
      other,
      lastText: last.text,
      lastAt: last.createdAt,
      unread: msgs.filter((m) => m.recipientId === myUserId && !m.readAt).length,
    })
  }
  return out.sort((a, b) => b.lastAt - a.lastAt)
}
