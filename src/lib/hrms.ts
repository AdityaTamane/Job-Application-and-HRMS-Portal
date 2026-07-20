import { db, logAudit, notify } from './db'
import { uid } from './utils'
import type {
  Attendance, AttendanceStatus, Employee, LeaveRequest, LeaveStatus, PayrollRecord,
} from './types'

export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function nowTime() {
  return new Date().toTimeString().slice(0, 5)
}

// ---- Employees ----
export async function addEmployee(data: Omit<Employee, 'id' | 'createdAt'>, admin: { id: string; name: string }) {
  const id = uid('emp')
  await db.employees.add({ ...data, id, createdAt: Date.now() })
  await logAudit(admin.id, admin.name, 'add_employee', id, data.name)
  return id
}

export async function updateEmployee(id: string, patch: Partial<Employee>, admin: { id: string; name: string }) {
  await db.employees.update(id, patch)
  await logAudit(admin.id, admin.name, 'update_employee', id)
}

// ---- Attendance ----
async function getTodayAttendance(employeeId: string): Promise<Attendance | undefined> {
  return db.attendance.where('employeeId').equals(employeeId).and((a) => a.date === todayStr()).first()
}

export async function checkIn(employee: Employee) {
  const existing = await getTodayAttendance(employee.id)
  if (existing) {
    await db.attendance.update(existing.id, { checkIn: existing.checkIn ?? nowTime(), status: 'present' })
  } else {
    await db.attendance.add({ id: uid('att'), employeeId: employee.id, date: todayStr(), checkIn: nowTime(), status: 'present' })
  }
}

export async function checkOut(employee: Employee) {
  const existing = await getTodayAttendance(employee.id)
  if (existing) await db.attendance.update(existing.id, { checkOut: nowTime() })
}

export async function setAttendanceStatus(employeeId: string, date: string, status: AttendanceStatus) {
  const existing = await db.attendance.where('employeeId').equals(employeeId).and((a) => a.date === date).first()
  if (existing) await db.attendance.update(existing.id, { status })
  else await db.attendance.add({ id: uid('att'), employeeId, date, status })
}

// ---- Leaves ----
export async function applyLeave(data: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) {
  const id = uid('lv')
  await db.leaves.add({ ...data, id, status: 'pending', createdAt: Date.now() })
  const admin = await db.users.where('role').equals('admin').first()
  if (admin) await notify(admin.id, 'New leave request', 'A leave request is awaiting your approval.', 'action', '/hrms/leaves')
  return id
}

export async function decideLeave(leave: LeaveRequest, status: LeaveStatus, admin: { id: string; name: string }) {
  await db.leaves.update(leave.id, { status, approverId: admin.id })
  if (status === 'approved') {
    // mark attendance leave for the range (single-day simplification per date string)
    await setAttendanceStatus(leave.employeeId, leave.from, 'leave')
    await db.employees.update(leave.employeeId, { status: 'on_leave' })
  }
  await logAudit(admin.id, admin.name, `${status}_leave`, leave.id)
}

// ---- Payroll ----
export async function generatePayroll(month: string, admin: { id: string; name: string }) {
  const employees = await db.employees.where('status').notEqual('terminated').toArray()
  let created = 0
  for (const e of employees) {
    const exists = await db.payroll.where('employeeId').equals(e.id).and((p) => p.month === month).first()
    if (exists) continue
    await db.payroll.add({
      id: `pay_${e.id}_${month}`,
      employeeId: e.id,
      month,
      base: e.monthlySalary,
      allowances: Math.round(e.monthlySalary * 0.1),
      deductions: Math.round(e.monthlySalary * 0.08),
      net: Math.round(e.monthlySalary * 1.02),
      status: 'draft',
    })
    created += 1
  }
  await logAudit(admin.id, admin.name, 'generate_payroll', month, `${created} records`)
  return created
}

export async function setPayrollStatus(rec: PayrollRecord, status: PayrollRecord['status'], admin: { id: string; name: string }) {
  await db.payroll.update(rec.id, { status })
  await logAudit(admin.id, admin.name, 'payroll_' + status, rec.id)
}

export async function processAllPayroll(month: string, status: PayrollRecord['status'], admin: { id: string; name: string }) {
  const recs = await db.payroll.where('month').equals(month).toArray()
  await Promise.all(recs.map((r) => db.payroll.update(r.id, { status })))
  await logAudit(admin.id, admin.name, 'payroll_bulk_' + status, month, `${recs.length} records`)
}
