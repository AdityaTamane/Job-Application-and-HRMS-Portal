import { db, logAudit, notify } from './db'
import { uid, generateOtp, distanceMeters } from './utils'
import type { GeoPoint, Job, Student, WorkSession } from './types'

/** Metres within which a student must be to start a job. */
export const GEOFENCE_RADIUS_M = 200

export async function getSessionForJob(jobId: string) {
  return db.workSessions.where('jobId').equals(jobId).first()
}

/** Get the existing pre-check/active session for a job, or create a fresh one. */
export async function getOrCreateSession(job: Job, student: Student): Promise<WorkSession> {
  const existing = await getSessionForJob(job.id)
  if (existing) return existing
  const session: WorkSession = {
    id: uid('ws'),
    jobId: job.id,
    studentId: student.id,
    status: 'pre_check',
    selfieVerified: false,
    micGranted: false,
    otp: generateOtp(),
    otpVerified: false,
    geofenceOk: false,
    locationTrail: [],
    elapsedSeconds: 0,
    sosTriggered: false,
    createdAt: Date.now(),
  }
  await db.workSessions.add(session)
  await db.jobs.update(job.id, { workSessionId: session.id, status: 'verifying' })
  return session
}

export async function updateSession(id: string, patch: Partial<WorkSession>) {
  await db.workSessions.update(id, patch)
}

/** All four gates passed → begin the timed work session. */
export async function startWork(session: WorkSession, job: Job, at: GeoPoint) {
  await db.workSessions.update(session.id, {
    status: 'active',
    startedAt: Date.now(),
    startLat: at.lat,
    startLng: at.lng,
    locationTrail: [at],
  })
  await db.jobs.update(job.id, { status: 'in_progress' })
  await notify(job.customerId, 'Work started', `Your pro has verified in and started "${job.title}".`, 'success', '/customer/track')
  const student = await db.students.get(session.studentId)
  if (student) await logAudit(student.userId, student.name, 'start_work', job.id)
}

export async function appendLocation(session: WorkSession, point: GeoPoint) {
  const fresh = await db.workSessions.get(session.id)
  if (!fresh || fresh.status !== 'active') return
  const trail = [...fresh.locationTrail, point].slice(-50)
  await db.workSessions.update(session.id, { locationTrail: trail })
}

/** Live elapsed seconds including the currently-running segment. */
export function liveElapsed(session: WorkSession) {
  if (session.status === 'active' && session.startedAt) {
    return session.elapsedSeconds + Math.floor((Date.now() - session.startedAt) / 1000)
  }
  return session.elapsedSeconds
}

export async function pauseWork(session: WorkSession) {
  const add = session.startedAt ? Math.floor((Date.now() - session.startedAt) / 1000) : 0
  await db.workSessions.update(session.id, {
    status: 'paused',
    elapsedSeconds: session.elapsedSeconds + add,
    startedAt: undefined,
  })
}

export async function resumeWork(session: WorkSession) {
  await db.workSessions.update(session.id, { status: 'active', startedAt: Date.now() })
}

export async function endWork(session: WorkSession, job: Job) {
  const add = session.status === 'active' && session.startedAt ? Math.floor((Date.now() - session.startedAt) / 1000) : 0
  await db.workSessions.update(session.id, {
    status: 'ended',
    elapsedSeconds: session.elapsedSeconds + add,
    endedAt: Date.now(),
    startedAt: undefined,
  })
  await db.jobs.update(job.id, { status: 'completed' })
  const student = await db.students.get(session.studentId)
  if (student) {
    await db.students.update(student.id, { jobsCompleted: student.jobsCompleted + 1 })
    await logAudit(student.userId, student.name, 'end_work', job.id)
  }
  await notify(job.customerId, 'Job completed', `"${job.title}" has been marked complete. Please rate your experience.`, 'success', '/customer/bookings')
}

export async function triggerSos(session: WorkSession, job: Job) {
  await db.workSessions.update(session.id, { sosTriggered: true })
  const admin = await db.users.where('role').equals('admin').first()
  const student = await db.students.get(session.studentId)
  const name = student?.name ?? 'A student'
  if (admin) await notify(admin.id, '🚨 SOS triggered', `${name} raised an SOS during "${job.title}" at ${job.address}.`, 'warning', '/admin')
  await notify(job.customerId, 'Safety alert', `An SOS was raised for your job "${job.title}". Our team has been alerted.`, 'warning')
  if (student) await logAudit(student.userId, student.name, 'sos', job.id, job.address)
}

/** Small deterministic jitter around a point to simulate live movement. */
export function jitterAround(lat: number, lng: number, i: number): GeoPoint {
  const r = 0.00035
  return {
    lat: lat + Math.sin(i * 1.7) * r,
    lng: lng + Math.cos(i * 2.3) * r,
    t: Date.now(),
  }
}

export { distanceMeters }
