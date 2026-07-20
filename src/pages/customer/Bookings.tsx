import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { CalendarClock, MapPin, Receipt, Radar, Star, RotateCcw, XCircle, CalendarCheck } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { cancelBooking } from '@/lib/marketplace'
import type { Job, Student } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, EmptyState } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'
import { Rating } from '@/components/common/Rating'
import { BookingModal } from '@/components/marketplace/BookingModal'
import { RateBookingModal } from '@/components/marketplace/RateBookingModal'
import { toast } from '@/components/ui/toast'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const UPCOMING: Job['status'][] = ['requested', 'assigned', 'accepted', 'en_route', 'verifying', 'in_progress']
const ACTIVE: Job['status'][] = ['en_route', 'verifying', 'in_progress']
const CANCELLABLE: Job['status'][] = ['requested', 'assigned', 'accepted']

export function Bookings() {
  const { user } = useAuth()
  const jobs = useLiveQuery(
    async () => (user ? db.jobs.where('customerId').equals(user.id).reverse().sortBy('createdAt') : []),
    [user?.id],
  )
  const students = useLiveQuery(() => db.students.toArray(), [])
  const studentMap = useMemo(() => new Map((students ?? []).map((s) => [s.id, s])), [students])

  const [tab, setTab] = useState('upcoming')
  const [rebook, setRebook] = useState<Student | null>(null)
  const [rating, setRating] = useState<Job | null>(null)

  const groups = useMemo(() => {
    const all = jobs ?? []
    return {
      upcoming: all.filter((j) => UPCOMING.includes(j.status)),
      completed: all.filter((j) => j.status === 'completed'),
      cancelled: all.filter((j) => j.status === 'cancelled' || j.status === 'declined'),
    }
  }, [jobs])

  const list = groups[tab as keyof typeof groups]

  const doCancel = async (job: Job) => {
    if (!user) return
    await cancelBooking(job, user.name)
    toast.info('Booking cancelled')
  }

  return (
    <div>
      <PageHeader title="My Bookings" subtitle="Track and manage the services you've booked" />

      <div className="mb-5">
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
            { id: 'completed', label: 'Completed', count: groups.completed.length },
            { id: 'cancelled', label: 'Cancelled', count: groups.cancelled.length },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-7 w-7" />}
          title="Nothing here yet"
          description="When you book a pro, it'll show up here so you can track and manage it."
          action={
            <Link to="/customer">
              <Button>Explore services</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {list.map((job) => {
            const student = job.studentId ? studentMap.get(job.studentId) : undefined
            return (
              <div key={job.id} className="card p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-start gap-3">
                    {student ? (
                      <Avatar src={student.photoUrl} name={student.name} size={48} />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">?</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{job.title}</h3>
                        <StatusPill status={job.status} />
                      </div>
                      {student && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                          {student.name}
                          {student.badgeTier !== 'none' && <VerifiedBadge tier={student.badgeTier} showLabel={false} size="sm" />}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {formatDateTime(job.scheduledAt)}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.address || job.neighbourhood}</span>
                        <span className="flex items-center gap-1"><Receipt className="h-3.5 w-3.5" /> {formatCurrency(job.estimatedPrice)}</span>
                      </div>
                      {job.status === 'completed' && job.customerRating && (
                        <div className="mt-2"><Rating value={job.customerRating} size={13} /></div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {ACTIVE.includes(job.status) && (
                      <Link to="/customer/track">
                        <Button size="sm" icon={<Radar className="h-4 w-4" />}>Track live</Button>
                      </Link>
                    )}
                    {job.status === 'completed' && !job.customerRating && (
                      <Button size="sm" variant="secondary" icon={<Star className="h-4 w-4" />} onClick={() => setRating(job)}>
                        Rate
                      </Button>
                    )}
                    {(job.status === 'completed' || job.status === 'cancelled') && student && (
                      <Button size="sm" variant="outline" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setRebook(student)}>
                        Rebook
                      </Button>
                    )}
                    {CANCELLABLE.includes(job.status) && (
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" icon={<XCircle className="h-4 w-4" />} onClick={() => doCancel(job)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <BookingModal student={rebook} open={!!rebook} onClose={() => setRebook(null)} onBooked={() => setTab('upcoming')} />
      <RateBookingModal job={rating} open={!!rating} onClose={() => setRating(null)} />
    </div>
  )
}
