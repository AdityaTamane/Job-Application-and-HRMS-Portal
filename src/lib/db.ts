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
  LeaveRequest,
  PayrollRecord,
  Notification,
  AuditLog,
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
  leaves!: Table<LeaveRequest, string>
  payroll!: Table<PayrollRecord, string>
  notifications!: Table<Notification, string>
  audit!: Table<AuditLog, string>

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
