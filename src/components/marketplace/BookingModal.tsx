import { useMemo, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Clock, MapPin, Receipt } from 'lucide-react'
import type { Student } from '@/lib/types'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { createBooking, estimatePrice } from '@/lib/marketplace'
import { upcomingAvailability, prettyTime, hasCustomAvailability } from '@/lib/availability'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea, Select } from '@/components/ui/form'
import { Avatar } from '@/components/ui/Avatar'
import { toast } from '@/components/ui/toast'
import { cn, formatCurrency } from '@/lib/utils'

export function BookingModal({
  student,
  open,
  onClose,
  onBooked,
}: {
  student: Student | null
  open: boolean
  onClose: () => void
  onBooked: () => void
}) {
  const { user } = useAuth()
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const studentJobs = useLiveQuery(
    () => (student ? db.jobs.where('studentId').equals(student.id).toArray() : []),
    [student?.id],
  )
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [when, setWhen] = useState<number | null>(null)
  const [dayIdx, setDayIdx] = useState(0)
  const [duration, setDuration] = useState('2')
  const [loading, setLoading] = useState(false)

  const cats = useMemo(
    () => categories?.filter((c) => student?.serviceCategoryIds.includes(c.id)) ?? [],
    [categories, student],
  )
  const days = useMemo(
    () => (student ? upcomingAvailability(student, studentJobs ?? [], Date.now()) : []),
    [student, studentJobs],
  )
  const activeCat = categoryId || cats[0]?.id || ''
  const price = student ? estimatePrice(student.hourlyRate, Number(duration) || 0) : 0

  if (!student) return null
  const selectedDay = days[dayIdx]

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!when) {
      toast.error('Please pick an available time slot')
      return
    }
    setLoading(true)
    try {
      await createBooking({
        customerId: user.id,
        customerName: user.name,
        student,
        categoryId: activeCat,
        title: title || cats.find((c) => c.id === activeCat)?.name || 'Service booking',
        description,
        address,
        scheduledAt: when,
        durationHours: Number(duration) || 1,
      })
      toast.success('Booking requested!', `${student.name.split(' ')[0]} will confirm shortly.`)
      onBooked()
      onClose()
      // reset
      setTitle('')
      setDescription('')
      setAddress('')
      setWhen(null)
      setDayIdx(0)
    } catch {
      toast.error('Could not create booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Book a service" size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-3">
          <Avatar src={student.photoUrl} name={student.name} size={44} />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(student.hourlyRate)}/hr · {student.neighbourhood}</p>
          </div>
        </div>

        <Field label="Service" required>
          <Select value={activeCat} onChange={(e) => setCategoryId(e.target.value)} required>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="What do you need?" hint="A short title helps the pro prepare">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Deep clean 2BHK" />
        </Field>

        <Field label="Details">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the job, any specifics…" />
        </Field>

        <Field label="Address" required>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input className="pl-9" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Flat / street / landmark" required />
          </div>
        </Field>

        <Field
          label="Pick an available slot"
          required
          hint={hasCustomAvailability(student) ? `${student.name.split(' ')[0]}'s published availability` : undefined}
        >
          {days.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
              No open slots in the next few weeks. Try another pro.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Day selector */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map((d, i) => (
                  <button
                    key={d.ts}
                    type="button"
                    onClick={() => {
                      setDayIdx(i)
                      setWhen(null)
                    }}
                    className={cn(
                      'flex shrink-0 flex-col items-center rounded-xl border px-3 py-1.5 text-xs font-semibold transition',
                      i === dayIdx
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400',
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {/* Slots for selected day */}
              <div className="flex flex-wrap gap-2">
                {selectedDay?.slots.map((s) => (
                  <button
                    key={s.ts}
                    type="button"
                    disabled={s.taken}
                    onClick={() => setWhen(s.ts)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                      s.taken
                        ? 'cursor-not-allowed border-slate-200 text-slate-300 line-through dark:border-slate-800 dark:text-slate-600'
                        : when === s.ts
                          ? 'border-brand-500 bg-brand-gradient text-white shadow-glow'
                          : 'border-slate-200 text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:text-slate-300',
                    )}
                    title={s.taken ? 'Already booked' : undefined}
                  >
                    {prettyTime(s.time)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Field>

        <Field label="Duration (hours)" required>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input className="pl-9" type="number" min="1" max="12" step="0.5" value={duration} onChange={(e) => setDuration(e.target.value)} required />
          </div>
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Receipt className="h-4 w-4" /> Estimated total
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatCurrency(price)}</span>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={loading} disabled={!when}>Confirm booking</Button>
        </div>
      </form>
    </Modal>
  )
}
