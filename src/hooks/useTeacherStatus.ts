import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import type { Employee, TeacherApplicant } from '@/lib/types'

export interface TeacherStatus {
  applicant?: TeacherApplicant
  employee?: Employee
  hired: boolean
}

/**
 * Resolves a teacher's lifecycle state. A teacher is "hired" once their ATS
 * application reaches the `hired` stage (which also creates an HRMS employee
 * record). Drives the candidate → faculty switch across the teacher portal.
 * Returns `undefined` while loading.
 */
export function useTeacherStatus(): TeacherStatus | undefined {
  const { user } = useAuth()
  return useLiveQuery(async () => {
    if (!user || user.role !== 'teacher') return { hired: false }
    // After hiring, user.refId points at the employee record, so fall back to email.
    const byRef = user.refId ? await db.applicants.get(user.refId) : undefined
    const applicant = byRef ?? (await db.applicants.where('email').equals(user.email.toLowerCase()).first())
    const employee = await db.employees.where('userId').equals(user.id).first()
    const hired = applicant?.stage === 'hired' || !!employee
    return { applicant, employee, hired }
  }, [user?.id, user?.refId])
}
