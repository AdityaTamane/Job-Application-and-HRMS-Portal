import { useState } from 'react'
import type { Job } from '@/lib/types'
import { rateBooking } from '@/lib/marketplace'
import { useAuth } from '@/lib/auth'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea, Field } from '@/components/ui/form'
import { Rating } from '@/components/common/Rating'
import { toast } from '@/components/ui/toast'

export function RateBookingModal({
  job,
  open,
  onClose,
}: {
  job: Job | null
  open: boolean
  onClose: () => void
}) {
  const { user } = useAuth()
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  if (!job) return null

  const submit = async () => {
    if (!user) return
    setLoading(true)
    try {
      await rateBooking(job, rating, review, user.name)
      toast.success('Thanks for your feedback!')
      onClose()
      setReview('')
      setRating(5)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Rate your experience" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">How was “{job.title}”?</p>
        <div className="flex justify-center py-2">
          <Rating value={rating} interactive size={34} onChange={setRating} />
        </div>
        <Field label="Add a review (optional)">
          <Textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Share details about the work…" />
        </Field>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Skip</Button>
          <Button className="flex-1" loading={loading} onClick={submit}>Submit</Button>
        </div>
      </div>
    </Modal>
  )
}
