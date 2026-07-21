import { Flame, Trophy, Medal } from 'lucide-react'
import type { Student } from '@/lib/types'
import { buildLeaderboard, computeStreak } from '@/lib/leaderboard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const TIER_ICON: Record<string, string> = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' }

export function StreakCard({ completedTimestamps }: { completedTimestamps: number[] }) {
  const streak = computeStreak(completedTimestamps, Date.now())
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-beacon-400/15 blur-2xl" />
      <CardBody>
        <div className="flex items-center gap-4">
          <div className={cn('grid h-16 w-16 place-items-center rounded-2xl text-3xl', streak.activeThisWeek ? 'bg-beacon-gradient text-white shadow-glow-beacon' : 'bg-slate-100 dark:bg-slate-800')}>
            <Flame className={cn('h-8 w-8', !streak.activeThisWeek && 'text-slate-400 dark:text-slate-500')} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Work streak</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {streak.current} week{streak.current !== 1 && 's'} 🔥
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Best: {streak.best} · {streak.activeThisWeek ? 'Active this week' : 'Take a job to keep it alive'}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export function LeaderboardCard({ students, meId }: { students: Student[]; meId: string }) {
  const board = buildLeaderboard(students)
  const top = board.slice(0, 5)
  const mine = board.find((r) => r.student.id === meId)
  const showMine = mine && mine.rank > 5

  const medal = (rank: number) =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`

  const Row = ({ rank, student, points, tier, highlight }: (typeof board)[number] & { highlight?: boolean }) => (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2',
        highlight ? 'bg-brand-50 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:ring-brand-500/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
      )}
    >
      <span className="w-7 shrink-0 text-center text-sm font-bold text-slate-500 dark:text-slate-400">{medal(rank)}</span>
      <Avatar src={student.photoUrl} name={student.name} size={34} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
          {student.name} {highlight && <span className="text-xs text-brand-500">(you)</span>}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{TIER_ICON[tier]} {tier}</p>
      </div>
      <span className="shrink-0 text-sm font-bold text-slate-700 dark:text-slate-200">{points} pts</span>
    </div>
  )

  return (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-beacon-500" /> Top pros this season</span>} subtitle="Ranked by career points" />
      <CardBody className="space-y-1">
        {top.map((r) => (
          <Row key={r.student.id} {...r} highlight={r.student.id === meId} />
        ))}
        {showMine && (
          <>
            <div className="flex items-center justify-center py-1 text-slate-300 dark:text-slate-600">
              <Medal className="h-3.5 w-3.5" />
            </div>
            <Row {...mine!} highlight />
          </>
        )}
      </CardBody>
    </Card>
  )
}
