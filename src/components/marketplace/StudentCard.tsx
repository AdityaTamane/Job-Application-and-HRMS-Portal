import { MapPin, CheckCircle2 } from 'lucide-react'
import type { Student } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'
import { Rating } from '@/components/common/Rating'
import { formatCurrency } from '@/lib/utils'

const AVAIL: Record<Student['availability'], { label: string; cls: string }> = {
  available: { label: 'Available', cls: 'text-emerald-600' },
  busy: { label: 'Busy', cls: 'text-beacon-600' },
  offline: { label: 'Offline', cls: 'text-slate-400' },
}

export function StudentCard({
  student,
  onView,
  onBook,
}: {
  student: Student
  onView: (s: Student) => void
  onBook: (s: Student) => void
}) {
  const avail = AVAIL[student.availability]
  const canBook = student.availability !== 'offline'
  return (
    <div className="card flex flex-col p-5 transition hover:shadow-lift">
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar src={student.photoUrl} name={student.name} size={56} />
          {student.badgeTier !== 'none' && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5">
              <VerifiedBadge tier={student.badgeTier} showLabel={false} size="sm" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-slate-900">{student.name}</h3>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
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

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-900">
          {formatCurrency(student.hourlyRate)}
          <span className="font-normal text-slate-400">/hr</span>
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
