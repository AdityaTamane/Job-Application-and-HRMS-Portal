// ---------------------------------------------------------------------------
// Weekly availability + slot booking with conflict detection (client-side).
// Pros set recurring weekly slots; customers book concrete upcoming slots.
// A slot is "taken" if the pro already has a non-cancelled job at that time.
// ---------------------------------------------------------------------------

import type { Job, Student } from './types'

export const SLOT_TIMES = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function hasCustomAvailability(student: Student): boolean {
  const w = student.weeklyAvailability
  return !!w && Object.values(w).some((slots) => slots.length > 0)
}

export function prettyTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export interface DaySlot {
  time: string // "HH:mm"
  ts: number // absolute timestamp
  taken: boolean
}

export interface AvailableDay {
  ts: number // midnight of the day
  dow: number
  label: string // e.g. "Mon 22"
  slots: DaySlot[]
}

/**
 * Concrete bookable slots for the next `maxDays`, limited to the first
 * `wantDays` days that actually have availability. `now` is passed in.
 */
export function upcomingAvailability(
  student: Student,
  studentJobs: Job[],
  now: number,
  wantDays = 7,
  maxDays = 21,
): AvailableDay[] {
  const custom = hasCustomAvailability(student)
  const takenTs = new Set(
    studentJobs
      .filter((j) => j.studentId === student.id && j.status !== 'cancelled' && j.status !== 'declined')
      .map((j) => j.scheduledAt),
  )
  const base = new Date(now)
  base.setHours(0, 0, 0, 0)
  const out: AvailableDay[] = []
  for (let d = 0; d < maxDays && out.length < wantDays; d++) {
    const day = new Date(base.getTime() + d * 86400000)
    const dow = day.getDay()
    const allowed = custom ? student.weeklyAvailability?.[String(dow)] ?? [] : SLOT_TIMES
    if (!allowed.length) continue
    const slots: DaySlot[] = SLOT_TIMES.filter((t) => allowed.includes(t))
      .map((t) => {
        const [h, m] = t.split(':').map(Number)
        const dt = new Date(day)
        dt.setHours(h, m, 0, 0)
        const ts = dt.getTime()
        return { time: t, ts, taken: takenTs.has(ts) }
      })
      .filter((s) => s.ts > now)
    if (slots.length) {
      out.push({ ts: day.getTime(), dow, label: `${WEEKDAYS[dow]} ${day.getDate()}`, slots })
    }
  }
  return out
}
