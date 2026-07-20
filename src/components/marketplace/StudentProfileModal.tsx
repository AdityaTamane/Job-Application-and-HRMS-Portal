import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { MapPin, GraduationCap, Briefcase, CheckCircle2, Quote } from 'lucide-react'
import type { Student } from '@/lib/types'
import { db } from '@/lib/db'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'
import { Rating } from '@/components/common/Rating'
import { formatCurrency } from '@/lib/utils'

export function StudentProfileModal({
  student,
  open,
  onClose,
  onBook,
}: {
  student: Student | null
  open: boolean
  onClose: () => void
  onBook: (s: Student) => void
}) {
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const reviews = useLiveQuery(
    async () => {
      if (!student) return []
      const jobs = await db.jobs.where('studentId').equals(student.id).toArray()
      return jobs.filter((j) => j.customerRating && j.customerReview)
    },
    [student?.id],
  )
  if (!student) return null
  const cats = categories?.filter((c) => student.serviceCategoryIds.includes(c.id)) ?? []

  return (
    <Modal open={open} onClose={onClose} title="Pro profile" size="lg">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar src={student.photoUrl} name={student.name} size={72} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
              <VerifiedBadge tier={student.badgeTier} size="sm" />
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4" /> {student.neighbourhood}, {student.city}
            </div>
            <div className="mt-1.5">
              <Rating value={student.rating} count={student.ratingCount} size={16} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">{formatCurrency(student.hourlyRate)}</p>
            <p className="text-xs text-slate-400">per hour</p>
          </div>
        </div>

        {student.bio && <p className="text-sm text-slate-600">{student.bio}</p>}

        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<Briefcase className="h-4 w-4" />} label="Jobs done" value={student.jobsCompleted} />
          <Stat icon={<GraduationCap className="h-4 w-4" />} label="Batch" value={student.academyBatch.replace('Batch ', '')} />
          <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Radius" value={`${student.serviceRadiusKm} km`} />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Services</p>
          <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <Badge key={c.id} tone="blue">{c.name}</Badge>
            ))}
          </div>
        </div>

        {student.skills.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {student.skills.map((s) => (
                <Badge key={s} tone="gray">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {!!reviews?.length && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Reviews</p>
            <div className="space-y-2">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl bg-slate-50 p-3">
                  <Rating value={r.customerRating!} size={13} />
                  <p className="mt-1 flex gap-1.5 text-sm text-slate-600">
                    <Quote className="h-4 w-4 shrink-0 text-slate-300" /> {r.customerReview}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          <Button className="flex-1" disabled={student.availability === 'offline'} onClick={() => onBook(student)}>
            Book {student.name.split(' ')[0]}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className="mx-auto flex w-fit items-center gap-1 text-brand-500">{icon}</div>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  )
}
