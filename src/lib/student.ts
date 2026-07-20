import { db, logAudit, notify } from './db'
import { uid } from './utils'
import type { Availability, DocType, Job, Student } from './types'

/** Required documents for a student to be eligible for verification. */
export const REQUIRED_DOCS: { type: DocType; label: string; hint: string }[] = [
  { type: 'aadhaar', label: 'Aadhaar Card', hint: 'Government photo ID (front & back).' },
  { type: 'marksheet', label: 'Highest Education Marksheet', hint: 'Your latest qualification.' },
  { type: 'photo', label: 'Passport Photo', hint: 'A clear, recent headshot.' },
  { type: 'address_proof', label: 'Address Proof', hint: 'Utility bill / rental agreement (optional).' },
]

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadDocument(student: Student, type: DocType, label: string, file: File) {
  const dataUrl = await fileToDataUrl(file)
  // replace any existing doc of this type
  const existing = await db.documents.where('ownerId').equals(student.id).and((d) => d.type === type).toArray()
  await Promise.all(existing.map((d) => db.documents.delete(d.id)))
  await db.documents.add({
    id: uid('doc'),
    ownerId: student.id,
    type,
    label,
    fileName: file.name,
    dataUrl,
    status: 'pending',
    uploadedAt: Date.now(),
  })
  await logAudit(student.userId, student.name, 'upload_document', student.id, label)
}

/** Submit for admin review — sets verification to pending and notifies admin. */
export async function submitForVerification(student: Student) {
  await db.students.update(student.id, { verificationStatus: 'pending' })
  const admin = await db.users.where('role').equals('admin').first()
  if (admin) {
    await notify(admin.id, 'New verification request', `${student.name} submitted documents for review.`, 'action', '/admin/verification')
  }
  await logAudit(student.userId, student.name, 'submit_verification', student.id)
}

export async function setAvailability(student: Student, availability: Availability) {
  await db.students.update(student.id, { availability })
}

export async function updateStudentProfile(student: Student, patch: Partial<Student>) {
  await db.students.update(student.id, patch)
  await logAudit(student.userId, student.name, 'update_profile', student.id)
}

export async function acceptJob(job: Job, student: Student) {
  await db.jobs.update(job.id, { status: 'accepted', studentId: student.id })
  await notify(job.customerId, 'Booking accepted', `${student.name} accepted "${job.title}".`, 'success', '/customer/bookings')
  await logAudit(student.userId, student.name, 'accept_job', job.id)
}

export async function declineJob(job: Job, student: Student) {
  await db.jobs.update(job.id, { status: 'declined' })
  await notify(job.customerId, 'Booking declined', `${student.name} is unavailable for "${job.title}".`, 'warning', '/customer/bookings')
  await logAudit(student.userId, student.name, 'decline_job', job.id)
}

/** Pick up an open (unassigned) request. */
export async function pickUpJob(job: Job, student: Student) {
  await db.jobs.update(job.id, { status: 'accepted', studentId: student.id })
  await notify(job.customerId, 'A pro accepted your request', `${student.name} will handle "${job.title}".`, 'success', '/customer/bookings')
  await logAudit(student.userId, student.name, 'pickup_job', job.id)
}
