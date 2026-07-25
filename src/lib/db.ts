import Dexie, { type Table } from 'dexie'
import { uid } from './utils'
import type {
  User,
  Student,
  DocumentRecord,
  ServiceCategory,
  Job,
  WorkSession,
  TeacherApplicant,
  Employee,
  Attendance,
  AttendanceRequest,
  LeaveRequest,
  WorkforceRequest,
  PayrollRecord,
  Notification,
  Announcement,
  AuditLog,
  AssessmentResult,
  ChatMessage,
  IncidentCase,
  WalletTxn,
  CallLog,
} from './types'

export class LighthouseDB extends Dexie {
  users!: Table<User, string>
  students!: Table<Student, string>
  documents!: Table<DocumentRecord, string>
  categories!: Table<ServiceCategory, string>
  jobs!: Table<Job, string>
  workSessions!: Table<WorkSession, string>
  applicants!: Table<TeacherApplicant, string>
  employees!: Table<Employee, string>
  attendance!: Table<Attendance, string>
  attendanceRequests!: Table<AttendanceRequest, string>
  workforceRequests!: Table<WorkforceRequest, string>
  leaves!: Table<LeaveRequest, string>
  payroll!: Table<PayrollRecord, string>
  notifications!: Table<Notification, string>
  announcements!: Table<Announcement, string>
  audit!: Table<AuditLog, string>
  assessments!: Table<AssessmentResult, string>
  chat!: Table<ChatMessage, string>
  incidents!: Table<IncidentCase, string>
  walletTxns!: Table<WalletTxn, string>
  callLogs!: Table<CallLog, string>

  constructor() {
    super('lighthouse')
    this.version(1).stores({
      users: 'id, role, email',
      students: 'id, userId, verificationStatus, availability, city, neighbourhood',
      documents: 'id, ownerId, type, status',
      categories: 'id',
      jobs: 'id, customerId, studentId, categoryId, status',
      workSessions: 'id, jobId, studentId, status',
      applicants: 'id, stage, subject',
      employees: 'id, userId, department, status',
      attendance: 'id, employeeId, date',
      leaves: 'id, employeeId, status',
      payroll: 'id, employeeId, month',
      notifications: 'id, userId, read',
      audit: 'id, actorId',
    })
    // v2 — skill assessments (feature #6) and in-app chat (feature #5).
    this.version(2).stores({
      assessments: 'id, studentId, quizId, passed',
      chat: 'id, threadId, jobId, senderId, recipientId, createdAt',
    })
    // v3 — incident & dispute center.
    this.version(3).stores({
      incidents: 'id, type, status, priority, jobId, raisedById, createdAt',
    })
    // v4 — attendance regularization requests.
    this.version(4).stores({
      attendanceRequests: 'id, employeeId, status, date, createdAt',
    })
    // v5 — student/teacher self-service leave & regularization requests.
    this.version(5).stores({
      workforceRequests: 'id, applicantId, applicantRole, kind, status, createdAt',
    })
    // v6 — index applicants by email (used to resolve a hired teacher whose
    // user.refId now points at their employee record, not the applicant).
    this.version(6).stores({
      applicants: 'id, stage, subject, email',
    })
    // v7 — admin broadcast announcements.
    this.version(7).stores({
      announcements: 'id, audience, createdAt',
    })
    // v8 — wallet ledger (payments/escrow) and voice-call history.
    this.version(8).stores({
      walletTxns: 'id, userId, kind, jobId, createdAt',
      callLogs: 'id, callerId, calleeId, jobId, createdAt',
    })
  }
}

export const db = new LighthouseDB()

/** Write an audit-log entry. */
export async function logAudit(
  actorId: string,
  actorName: string,
  action: string,
  target: string,
  meta?: string,
) {
  await db.audit.add({
    id: uid('audit'),
    actorId,
    actorName,
    action,
    target,
    meta,
    createdAt: Date.now(),
  })
}

/** Push an in-app notification for a user. */
export async function notify(
  userId: string,
  title: string,
  body: string,
  type: Notification['type'] = 'info',
  link?: string,
) {
  await db.notifications.add({
    id: uid('ntf'),
    userId,
    title,
    body,
    type,
    read: false,
    link,
    createdAt: Date.now(),
  })
}
