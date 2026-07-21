import { MapPin, CheckCircle2, Sparkles } from 'lucide-react'
import type { Student } from '@/lib/types'
import type { MatchResult } from '@/lib/match'
import { scoreTone } from '@/lib/match'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'
import { Rating } from '@/components/common/Rating'
import { cn, formatCurrency } from '@/lib/utils'

const AVAIL: Record<Student['availability'], { label: string; cls: string }> = {
  available: { label: 'Available', cls: 'text-emerald-600' },
  busy: { label: 'Busy', cls: 'text-beacon-600' },
  offline: { label: 'Offline', cls: 'text-slate-400 dark:text-slate-500' },
}

export function StudentCard({
  student,
  onView,
  onBook,
  match,
  bestMatch = false,
}: {
  student: Student
  onView: (s: Student) => void
  onBook: (s: Student) => void
  match?: MatchResult
  bestMatch?: boolean
}) {
  const avail = AVAIL[student.availability]
  const canBook = student.availability !== 'offline'
  const toneCls: Record<string, string> = {
    green: 'bg-emerald-500 text-white',
    blue: 'bg-brand-600 text-white',
    amber: 'bg-beacon-500 text-brand-950',
    gray: 'bg-slate-400 text-white',
  }
  return (
    <div
      className={cn(
        'card relative flex flex-col p-5 transition hover:shadow-lift',
        bestMatch && 'ring-2 ring-brand-500 dark:ring-brand-400',
      )}
    >
      {bestMatch && (
        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
          <Sparkles className="h-3 w-3" /> Best match
        </span>
      )}
      {match && (
        <span
          className={cn(
            'absolute right-4 top-4 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
            toneCls[scoreTone(match.score)],
          )}
          title="AI Smart-Match score"
        >
          {match.score}% match
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar src={student.photoUrl} name={student.name} size={56} />
          {student.badgeTier !== 'none' && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-white dark:bg-slate-900 p-0.5">
              <VerifiedBadge tier={student.badgeTier} showLabel={false} size="sm" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-slate-900 dark:text-slate-100">{student.name}</h3>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5" /> {student.neighbourhood}
          </div>
          <div className="mt-1">
            <Rating value={student.rating} count={student.ratingCount} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {student.skills.slice(0, 3).map((s) => (
          <Badge key={s} tone="blue">{s}</Badge>
        ))}
      </div>

      {match && match.reasons.length > 0 && (
        <ul className="mt-3 space-y-1">
          {match.reasons.slice(0, 3).map((r) => (
            <li key={r} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              {r}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(student.hourlyRate)}
          <span className="font-normal text-slate-400 dark:text-slate-500">/hr</span>
        </span>
        <span className={`flex items-center gap-1 text-xs font-medium ${avail.cls}`}>
          <CheckCircle2 className="h-3.5 w-3.5" /> {avail.label}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(student)}>
          View profile
        </Button>
        <Button size="sm" className="flex-1" disabled={!canBook} onClick={() => onBook(student)}>
          Book now
        </Button>
      </div>
    </div>
  )
}
