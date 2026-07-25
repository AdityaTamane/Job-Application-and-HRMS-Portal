// ---------------------------------------------------------------------------
// Browser notification helpers — turns the app's in-app notifications into
// real OS-level push notifications + an audible chime. All guarded so the app
// degrades cleanly where the Notification API or WebAudio is unavailable.
//
// There is no server/service worker, so these are foreground Web Notifications
// fired by the NotificationsWatcher when a new row lands in the Dexie
// `notifications` table (which Dexie's liveQuery observes across tabs).
// ---------------------------------------------------------------------------

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function pushPermission(): NotificationPermission {
  return pushSupported() ? Notification.permission : 'denied'
}

export async function requestPush(): Promise<NotificationPermission> {
  if (!pushSupported()) return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

/**
 * Show an OS notification, but only when the tab is hidden — when the app is
 * focused the in-app toast already covers it, and doubling up is noisy.
 */
export function showBrowserNotification(title: string, body?: string, tag?: string) {
  if (!pushSupported() || Notification.permission !== 'granted') return
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') return
  try {
    new Notification(title, { body, tag, icon: '/favicon.svg' })
  } catch {
    /* some browsers throw if constructed directly — ignore */
  }
}

// --- Audible chime (WebAudio, no asset) -------------------------------------

let audioCtx: AudioContext | null = null
function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!audioCtx) audioCtx = new AC()
  return audioCtx
}

/** A short two-note chime. Silently no-ops if audio is blocked/unavailable. */
export function playChime() {
  const ac = ctx()
  if (!ac) return
  try {
    if (ac.state === 'suspended') ac.resume()
    const now = ac.currentTime
    const notes = [880, 1174.7] // A5 → D6
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = now + i * 0.12
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22)
      osc.connect(gain).connect(ac.destination)
      osc.start(start)
      osc.stop(start + 0.24)
    })
  } catch {
    /* ignore audio errors */
  }
}

const SOUND_KEY = 'lighthouse:notif-sound'
export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off'
  } catch {
    return true
  }
}
export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
}
