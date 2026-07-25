// ---------------------------------------------------------------------------
// In-app voice calling — signalling over BroadcastChannel (no server).
//
// WebRTC offer/answer/ICE are exchanged over a BroadcastChannel, so a real
// two-way audio call connects between two tabs of the same browser (e.g. a
// customer tab and a pro tab). Across separate devices there's no signalling
// relay, so the call UI (ring → accept → timer → hang up) still runs but audio
// won't bridge — matching the app's other simulated, serverless features.
//
// Call history persists to the Dexie `callLogs` table. Only the caller writes
// the log row; since a row carries both callerId and calleeId, both parties
// see it in their history (filtered by whichever id is theirs).
// ---------------------------------------------------------------------------

import { db } from './db'
import { uid } from './utils'
import type { CallLog } from './types'

export type CallSignal =
  | {
      kind: 'invite'
      callId: string
      from: string
      fromName: string
      to: string
      jobId?: string
      sdp: RTCSessionDescriptionInit
    }
  | { kind: 'accept'; callId: string; to: string; sdp: RTCSessionDescriptionInit }
  | { kind: 'decline'; callId: string; to: string }
  | { kind: 'cancel'; callId: string; to: string }
  | { kind: 'hangup'; callId: string; to: string }
  | { kind: 'busy'; callId: string; to: string }
  | { kind: 'ice'; callId: string; to: string; candidate: RTCIceCandidateInit }

let channel: BroadcastChannel | null = null
export function callChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) channel = new BroadcastChannel('lighthouse-call')
  return channel
}

export function sendSignal(sig: CallSignal) {
  callChannel()?.postMessage(sig)
}

export function onSignal(handler: (s: CallSignal) => void): () => void {
  const ch = callChannel()
  if (!ch) return () => {}
  const listener = (e: MessageEvent) => handler(e.data as CallSignal)
  ch.addEventListener('message', listener)
  return () => ch.removeEventListener('message', listener)
}

export async function logCall(entry: Omit<CallLog, 'id' | 'createdAt'>): Promise<void> {
  await db.callLogs.add({ ...entry, id: uid('call'), createdAt: Date.now() })
}

export function callHistoryForUser(userId: string) {
  return db.callLogs
    .filter((c) => c.callerId === userId || c.calleeId === userId)
    .reverse()
    .sortBy('createdAt')
}

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

export function fmtCallDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
