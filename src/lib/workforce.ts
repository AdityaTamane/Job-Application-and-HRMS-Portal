import { db, logAudit, notify } from './db'
import { uid } from './utils'
import type { LeaveStatus, WorkforceRequest } from './types'

/** Submit a leave / regularization request; notifies the admin queue. */
export async function applyWorkforceRequest(
  data: Omit<WorkforceRequest, 'id' | 'status' | 'createdAt'>,
) {
  const id = uid('wr')
  await db.workforceRequests.add({ ...data, id, status: 'pending', createdAt: Date.now() })
  const label = data.kind === 'leave' ? 'leave' : 'regularization'
  const admin = await db.users.where('role').equals('admin').first()
  if (admin) {
    await notify(
      admin.id,
      `New ${label} request`,
      `${data.applicantName} (${data.applicantRole}) submitted a ${label} request for approval.`,
      'action',
      '/admin/requests',
    )
  }
  await logAudit(data.applicantId, data.applicantName, `apply_${label}`, id)
  return id
}

/** Approve/reject a request; notifies the applicant and applies side effects. */
export async function decideWorkforceRequest(
  req: WorkforceRequest,
  status: LeaveStatus,
  admin: { id: string; name: string },
) {
  await db.workforceRequests.update(req.id, { status, approverId: admin.id, approverName: admin.name })
  const label = req.kind === 'leave' ? 'leave' : 'regularization'
  await notify(
    req.applicantId,
    `Your ${label} request was ${status}`,
    status === 'approved'
      ? `${admin.name} approved your ${label} request.`
      : `${admin.name} could not approve your ${label} request.`,
    status === 'approved' ? 'success' : 'warning',
  )
  // Approving a student's leave marks them offline in the marketplace for now.
  if (status === 'approved' && req.kind === 'leave' && req.applicantRole === 'student') {
    const student = await db.students.where('userId').equals(req.applicantId).first()
    if (student) await db.students.update(student.id, { availability: 'offline' })
  }
  await logAudit(admin.id, admin.name, `${status}_${label}`, req.id)
}
