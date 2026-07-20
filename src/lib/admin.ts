import { db, logAudit, notify } from './db'
import type { BadgeTier, DocumentRecord, Student } from './types'

export async function approveDocument(doc: DocumentRecord, admin: { id: string; name: string }) {
  await db.documents.update(doc.id, { status: 'approved', reviewNote: undefined, reviewedAt: Date.now() })
  await logAudit(admin.id, admin.name, 'approve_document', doc.ownerId, doc.label)
}

export async function rejectDocument(doc: DocumentRecord, note: string, admin: { id: string; name: string }) {
  await db.documents.update(doc.id, { status: 'rejected', reviewNote: note, reviewedAt: Date.now() })
  await logAudit(admin.id, admin.name, 'reject_document', doc.ownerId, doc.label)
}

/** Approve a student's overall verification and issue their badge. */
export async function verifyStudent(student: Student, tier: BadgeTier, admin: { id: string; name: string }) {
  await db.students.update(student.id, {
    verificationStatus: 'verified',
    badgeTier: tier === 'none' ? 'verified' : tier,
    verifiedAt: Date.now(),
  })
  await notify(student.userId, '✅ You are verified!', `Your documents were approved. You now have the ${tier} badge.`, 'success', '/student/verification')
  await logAudit(admin.id, admin.name, 'verify_student', student.id, tier)
}

export async function rejectStudentVerification(student: Student, reason: string, admin: { id: string; name: string }) {
  await db.students.update(student.id, { verificationStatus: 'rejected', badgeTier: 'none' })
  await notify(student.userId, 'Verification needs attention', reason || 'Some documents were rejected. Please review and resubmit.', 'warning', '/student/verification')
  await logAudit(admin.id, admin.name, 'reject_student', student.id, reason)
}

export async function setBadgeTier(student: Student, tier: BadgeTier, admin: { id: string; name: string }) {
  await db.students.update(student.id, { badgeTier: tier })
  await logAudit(admin.id, admin.name, 'set_badge', student.id, tier)
}
