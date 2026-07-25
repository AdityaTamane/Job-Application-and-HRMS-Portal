import { db, logAudit, notify } from './db'
import { refundEscrow } from './payments'
import { uid } from './utils'
import type { Job, Student } from './types'

export interface BookingInput {
  customerId: string
  customerName: string
  student: Student
  categoryId: string
  title: string
  description: string
  address: string
  scheduledAt: number
  durationHours: number
}

export function estimatePrice(hourlyRate: number, durationHours: number) {
  return Math.round(hourlyRate * durationHours)
}

/** Create a booking assigned directly to a chosen student. */
export async function createBooking(input: BookingInput): Promise<Job> {
  const job: Job = {
    id: uid('job'),
    customerId: input.customerId,
    studentId: input.student.id,
    categoryId: input.categoryId,
    title: input.title,
    description: input.description,
    address: input.address,
    neighbourhood: input.student.neighbourhood,
    city: input.student.city,
    lat: input.student.lat,
    lng: input.student.lng,
    scheduledAt: input.scheduledAt,
    durationHours: input.durationHours,
    estimatedPrice: estimatePrice(input.student.hourlyRate, input.durationHours),
    status: 'assigned',
    createdAt: Date.now(),
  }
  await db.jobs.add(job)
  await notify(
    input.student.userId,
    'New job request',
    `${input.customerName} requested "${input.title}".`,
    'action',
    '/student/jobs',
  )
  await logAudit(input.customerId, input.customerName, 'create_booking', job.id, input.title)
  return job
}

export async function cancelBooking(job: Job, byName: string) {
  await db.jobs.update(job.id, { status: 'cancelled' })
  // Return any escrowed funds to the customer.
  await refundEscrow(job)
  if (job.studentId) {
    const s = await db.students.get(job.studentId)
    if (s) await notify(s.userId, 'Booking cancelled', `"${job.title}" was cancelled by the customer.`, 'warning')
  }
  await logAudit(job.customerId, byName, 'cancel_booking', job.id)
}

export async function rateBooking(job: Job, rating: number, review: string, byName: string) {
  await db.jobs.update(job.id, { customerRating: rating, customerReview: review })
  // recompute student aggregate rating
  if (job.studentId) {
    const s = await db.students.get(job.studentId)
    if (s) {
      const totalScore = s.rating * s.ratingCount + rating
      const count = s.ratingCount + 1
      await db.students.update(s.id, {
        rating: Math.round((totalScore / count) * 10) / 10,
        ratingCount: count,
      })
      await notify(s.userId, 'You got a review!', `${byName} rated your work ${rating}★.`, 'success')
    }
  }
  await logAudit(job.customerId, byName, 'rate_booking', job.id, `${rating}★`)
}
