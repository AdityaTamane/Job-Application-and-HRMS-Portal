import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Phone, PhoneOff, PhoneIncoming, Mic, MicOff } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { notify } from '@/lib/db'
import { useT } from '@/lib/i18n'
import { toast } from '@/components/ui/toast'
import { Avatar } from '@/components/ui/Avatar'
import { playChime } from '@/lib/push'
import {
  onSignal,
  sendSignal,
  logCall,
  RTC_CONFIG,
  fmtCallDuration,
  type CallSignal,
} from '@/lib/call'
import type { CallOutcome } from '@/lib/types'
import { uid, cn } from '@/lib/utils'

type CallStatus = 'calling' | 'incoming' | 'connected' | 'ended'

interface ActiveCall {
  id: string
  role: 'caller' | 'callee'
  peerId: string
  peerName: string
  jobId?: string
  status: CallStatus
  muted: boolean
  startedAt?: number
}

interface CallContextValue {
  startCall: (peer: { id: string; name: string }, jobId?: string) => void
  inCall: boolean
}

const CallContext = createContext<CallContextValue | null>(null)

const RING_TIMEOUT_MS = 30_000

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const t = useT()
  const [call, setCall] = useState<ActiveCall | null>(null)

  // Mutable refs the signalling handlers read (they'd otherwise close over stale state).
  const callRef = useRef<ActiveCall | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)

  const update = useCallback((next: ActiveCall | null) => {
    callRef.current = next
    setCall(next)
  }, [])

  const clearTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }

  const cleanupMedia = useCallback(() => {
    pcRef.current?.getSenders().forEach((s) => s.track?.stop())
    try {
      pcRef.current?.close()
    } catch {
      /* ignore */
    }
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach((tk) => tk.stop())
    localStreamRef.current = null
    pendingOfferRef.current = null
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null
  }, [])

  const getMic = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      return stream
    } catch {
      // Mic denied/unavailable — the call still connects, just silent on our end.
      return null
    }
  }, [])

  const newPeerConnection = useCallback((callId: string, peerId: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG)
    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal({ kind: 'ice', callId, to: peerId, candidate: e.candidate.toJSON() })
    }
    pc.ontrack = (e) => {
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = e.streams[0]
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        const cur = callRef.current
        if (cur && cur.status !== 'connected') {
          update({ ...cur, status: 'connected', startedAt: cur.startedAt ?? Date.now() })
        }
      }
    }
    pcRef.current = pc
    return pc
  }, [update])

  /** Wind down the current call, optionally recording it (caller only). */
  const finishCall = useCallback(
    (outcome: CallOutcome, opts?: { log?: boolean }) => {
      const cur = callRef.current
      if (!cur || cur.status === 'ended') return
      clearTimer()
      const duration = cur.startedAt ? Math.floor((Date.now() - cur.startedAt) / 1000) : 0
      // Only the caller writes the log; a row's caller/callee ids let both parties see it.
      if (cur.role === 'caller' && opts?.log !== false && user) {
        void logCall({
          jobId: cur.jobId,
          callerId: user.id,
          callerName: user.name,
          calleeId: cur.peerId,
          calleeName: cur.peerName,
          outcome,
          durationSeconds: duration,
        })
        // Leave the callee a trace of an unanswered call in their notifications.
        if (outcome === 'unavailable' || outcome === 'missed') {
          void notify(cur.peerId, '📞 Missed call', `You missed a voice call from ${user.name}.`, 'info')
        }
      }
      cleanupMedia()
      update({ ...cur, status: 'ended' })
      setTimeout(() => {
        // Only clear if this same call is still the ended one.
        if (callRef.current?.id === cur.id) update(null)
      }, 1300)
    },
    [cleanupMedia, update, user],
  )

  const startCall = useCallback(
    async (peer: { id: string; name: string }, jobId?: string) => {
      if (!user) return
      if (callRef.current) {
        toast.warning('You are already on a call')
        return
      }
      if (peer.id === user.id) return
      const id = uid('call')
      update({ id, role: 'caller', peerId: peer.id, peerName: peer.name, jobId, status: 'calling', muted: false })
      const pc = newPeerConnection(id, peer.id)
      const stream = await getMic()
      stream?.getTracks().forEach((tk) => pc.addTrack(tk, stream))
      const offer = await pc.createOffer({ offerToReceiveAudio: true })
      await pc.setLocalDescription(offer)
      sendSignal({ kind: 'invite', callId: id, from: user.id, fromName: user.name, to: peer.id, jobId, sdp: offer })
      // No answer in time → treat as unavailable.
      timeoutRef.current = setTimeout(() => {
        if (callRef.current?.id === id && callRef.current.status === 'calling') {
          sendSignal({ kind: 'cancel', callId: id, to: peer.id })
          toast.info(t('call.unavailable'))
          finishCall('unavailable')
        }
      }, RING_TIMEOUT_MS)
    },
    [user, update, newPeerConnection, getMic, finishCall, t],
  )

  const acceptCall = useCallback(async () => {
    const cur = callRef.current
    if (!cur || cur.role !== 'callee' || !pendingOfferRef.current || !user) return
    clearTimer()
    const pc = newPeerConnection(cur.id, cur.peerId)
    const stream = await getMic()
    stream?.getTracks().forEach((tk) => pc.addTrack(tk, stream))
    await pc.setRemoteDescription(pendingOfferRef.current)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    sendSignal({ kind: 'accept', callId: cur.id, to: cur.peerId, sdp: answer })
    update({ ...cur, status: 'connected', startedAt: Date.now() })
  }, [user, newPeerConnection, getMic, update])

  const declineCall = useCallback(() => {
    const cur = callRef.current
    if (!cur) return
    sendSignal({ kind: 'decline', callId: cur.id, to: cur.peerId })
    cleanupMedia()
    update(null)
    clearTimer()
  }, [cleanupMedia, update])

  const hangUp = useCallback(() => {
    const cur = callRef.current
    if (!cur) return
    if (cur.status === 'connected') {
      sendSignal({ kind: 'hangup', callId: cur.id, to: cur.peerId })
      finishCall('completed')
    } else if (cur.role === 'caller') {
      sendSignal({ kind: 'cancel', callId: cur.id, to: cur.peerId })
      finishCall('cancelled')
    } else {
      declineCall()
    }
  }, [finishCall, declineCall])

  const toggleMute = useCallback(() => {
    const cur = callRef.current
    if (!cur) return
    const tracks = localStreamRef.current?.getAudioTracks() ?? []
    const nextMuted = !cur.muted
    tracks.forEach((tk) => (tk.enabled = !nextMuted))
    update({ ...cur, muted: nextMuted })
  }, [update])

  // --- Signalling listener --------------------------------------------------
  useEffect(() => {
    if (!user) return
    return onSignal((sig: CallSignal) => {
      const cur = callRef.current
      switch (sig.kind) {
        case 'invite': {
          if (sig.to !== user.id) return
          if (cur) {
            sendSignal({ kind: 'busy', callId: sig.callId, to: sig.from })
            return
          }
          pendingOfferRef.current = sig.sdp
          update({
            id: sig.callId,
            role: 'callee',
            peerId: sig.from,
            peerName: sig.fromName,
            jobId: sig.jobId,
            status: 'incoming',
            muted: false,
          })
          playChime()
          // Unanswered incoming rings out as missed.
          timeoutRef.current = setTimeout(() => {
            if (callRef.current?.id === sig.callId && callRef.current.status === 'incoming') {
              sendSignal({ kind: 'decline', callId: sig.callId, to: sig.from })
              update(null)
            }
          }, RING_TIMEOUT_MS)
          break
        }
        case 'accept':
          if (!cur || cur.id !== sig.callId) return
          clearTimer()
          void pcRef.current?.setRemoteDescription(sig.sdp)
          update({ ...cur, status: 'connected', startedAt: cur.startedAt ?? Date.now() })
          break
        case 'ice':
          if (!cur || cur.id !== sig.callId) return
          void pcRef.current?.addIceCandidate(sig.candidate).catch(() => {})
          break
        case 'decline':
          if (!cur || cur.id !== sig.callId) return
          toast.info(t('call.ended'))
          finishCall('declined')
          break
        case 'busy':
          if (!cur || cur.id !== sig.callId) return
          toast.info(t('call.unavailable'))
          finishCall('unavailable')
          break
        case 'cancel':
          if (!cur || cur.id !== sig.callId) return
          // Caller gave up before we answered — clear without the callee logging.
          cleanupMedia()
          clearTimer()
          update(null)
          break
        case 'hangup':
          if (!cur || cur.id !== sig.callId) return
          // Other side hung up. Caller logs; callee just tears down.
          finishCall('completed', { log: false })
          break
      }
    })
  }, [user, update, finishCall, cleanupMedia, t])

  // Clean up if the user logs out mid-call.
  useEffect(() => {
    if (!user && callRef.current) {
      cleanupMedia()
      clearTimer()
      update(null)
    }
  }, [user, cleanupMedia, update])

  return (
    <CallContext.Provider value={{ startCall, inCall: !!call }}>
      {children}
      <audio ref={remoteAudioRef} autoPlay className="hidden" />
      {call && (
        <CallUI
          call={call}
          onAccept={acceptCall}
          onDecline={declineCall}
          onHangUp={hangUp}
          onToggleMute={toggleMute}
        />
      )}
    </CallContext.Provider>
  )
}

export function useCall() {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error('useCall must be used within CallProvider')
  return ctx
}

// --- Overlays ---------------------------------------------------------------

function CallUI({
  call,
  onAccept,
  onDecline,
  onHangUp,
  onToggleMute,
}: {
  call: ActiveCall
  onAccept: () => void
  onDecline: () => void
  onHangUp: () => void
  onToggleMute: () => void
}) {
  const t = useT()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (call.status !== 'connected' || !call.startedAt) return
    const tick = () => setElapsed(Math.floor((Date.now() - (call.startedAt ?? Date.now())) / 1000))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [call.status, call.startedAt])

  const statusLabel =
    call.status === 'incoming'
      ? t('call.incoming')
      : call.status === 'calling'
        ? t('call.ringing')
        : call.status === 'connected'
          ? fmtCallDuration(elapsed)
          : t('call.ended')

  // Incoming call → full ringing modal with accept/decline.
  if (call.status === 'incoming') {
    return createPortal(
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-950/50 backdrop-blur-sm">
        <div className="w-[calc(100vw-2rem)] max-w-sm animate-fade-in rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lift dark:border-slate-800 dark:bg-slate-900">
          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
            <PhoneIncoming className="h-3.5 w-3.5 animate-pulse" /> {t('call.incoming')}
          </p>
          <div className="mt-4 flex flex-col items-center">
            <Avatar name={call.peerName} size={72} className="ring-4 ring-brand-100 dark:ring-brand-500/20" />
            <p className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">{call.peerName}</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">{t('call.voiceCall')}</p>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              onClick={onDecline}
              className="grid h-14 w-14 place-items-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
              aria-label={t('call.decline')}
            >
              <PhoneOff className="h-6 w-6" />
            </button>
            <button
              onClick={onAccept}
              className="grid h-14 w-14 animate-bounce place-items-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600"
              aria-label={t('call.accept')}
            >
              <Phone className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  // Calling / connected / ended → floating call bar.
  return createPortal(
    <div className="fixed bottom-4 left-1/2 z-[120] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 animate-fade-in rounded-2xl border border-slate-200 bg-white p-4 shadow-lift dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar name={call.peerName} size={48} />
          {call.status === 'connected' && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{call.peerName}</p>
          <p className={cn('text-sm', call.status === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500')}>
            {call.status === 'calling' && <span className="mr-1 inline-block animate-pulse">●</span>}
            {statusLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {call.status === 'connected' && (
            <button
              onClick={onToggleMute}
              className={cn(
                'grid h-10 w-10 place-items-center rounded-full transition',
                call.muted
                  ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
              )}
              aria-label={call.muted ? t('call.unmute') : t('call.mute')}
              title={call.muted ? t('call.unmute') : t('call.mute')}
            >
              {call.muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
          <button
            onClick={onHangUp}
            disabled={call.status === 'ended'}
            className="grid h-10 w-10 place-items-center rounded-full bg-red-500 text-white transition hover:bg-red-600 disabled:opacity-50"
            aria-label={t('call.hangUp')}
            title={t('call.hangUp')}
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
