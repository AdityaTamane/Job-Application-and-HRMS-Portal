import { useMemo, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarClock, Clock, MapPin, Receipt } from 'lucide-react'
import type { Student } from '@/lib/types'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { createBooking, estimatePrice } from '@/lib/marketplace'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea, Select } from '@/components/ui/form'
import { Avatar } from '@/components/ui/Avatar'
import { toast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'

function defaultDateTime() {
  const d = new Date(Date.now() + 86400000)
  d.setHours(10, 0, 0, 0)
  // format for datetime-local input: YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

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
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [when, setWhen] = useState(defaultDateTime())
  const [duration, setDuration] = useState('2')
  const [loading, setLoading] = useState(false)

  const cats = useMemo(
    () => categories?.filter((c) => student?.serviceCategoryIds.includes(c.id)) ?? [],
    [categories, student],
  )
  const activeCat = categoryId || cats[0]?.id || ''
  const price = student ? estimatePrice(student.hourlyRate, Number(duration) || 0) : 0

  if (!student) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
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
        scheduledAt: new Date(when).getTime(),
        durationHours: Number(duration) || 1,
      })
      toast.success('Booking requested!', `${student.name.split(' ')[0]} will confirm shortly.`)
      onBooked()
      onClose()
      // reset
      setTitle('')
      setDescription('')
      setAddress('')
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
            <p className="font-semibold text-slate-900">{student.name}</p>
            <p className="text-xs text-slate-500">{formatCurrency(student.hourlyRate)}/hr · {student.neighbourhood}</p>
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
            <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input className="pl-9" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Flat / street / landmark" required />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date & time" required>
            <div className="relative">
              <CalendarClock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
            </div>
          </Field>
          <Field label="Hours" required>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" type="number" min="1" max="12" step="0.5" value={duration} onChange={(e) => setDuration(e.target.value)} required />
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Receipt className="h-4 w-4" /> Estimated total
          </span>
          <span className="text-lg font-bold text-slate-900">{formatCurrency(price)}</span>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={loading}>Confirm booking</Button>
        </div>
      </form>
    </Modal>
  )
}
