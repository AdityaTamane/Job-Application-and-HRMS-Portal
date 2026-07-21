// ---------------------------------------------------------------------------
// Gamification: weekly work streaks + a career-points leaderboard.
// Pure functions over existing data — no server.
// ---------------------------------------------------------------------------

import type { Student } from './types'
import { careerPoints, tierInfo, type CareerTier } from './assessments'

const DAY = 24 * 60 * 60 * 1000

/** Monday-00:00 timestamp for the week containing `ts`. */
function weekStart(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  const dow = (d.getDay() + 6) % 7 // 0 = Monday
  d.setTime(d.getTime() - dow * DAY)
  return d.getTime()
}

export interface StreakInfo {
  current: number // consecutive active weeks up to now
  best: number // longest run ever
  activeThisWeek: boolean
}

/** Weekly streak from the timestamps of completed jobs. */
export function computeStreak(jobTimestamps: number[], now: number): StreakInfo {
  if (!jobTimestamps.length) return { current: 0, best: 0, activeThisWeek: false }
  const weeks = new Set(jobTimestamps.map(weekStart))
  const thisWeek = weekStart(now)
  const activeThisWeek = weeks.has(thisWeek)

  // Current streak: start from this week (or last week as grace) and walk back.
  let cursor = activeThisWeek ? thisWeek : thisWeek - 7 * DAY
  let current = 0
  if (weeks.has(cursor)) {
    while (weeks.has(cursor)) {
      current++
      cursor -= 7 * DAY
    }
  }

  // Best streak across the full history.
  const sorted = [...weeks].sort((a, b) => a - b)
  let best = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 7 * DAY) run++
    else run = 1
    if (run > best) best = run
  }
  return { current, best: Math.max(best, current), activeThisWeek }
}

export interface LeaderRow {
  rank: number
  student: Student
  points: number
  tier: CareerTier
}

/** Rank students by career points (desc). */
export function buildLeaderboard(students: Student[]): LeaderRow[] {
  return [...students]
    .map((student) => ({ student, points: careerPoints(student), tier: tierInfo(student).tier }))
    .sort((a, b) => b.points - a.points)
    .map((row, i) => ({ rank: i + 1, ...row }))
}
