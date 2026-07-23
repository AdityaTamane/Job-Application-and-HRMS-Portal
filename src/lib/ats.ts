import { db, logAudit, notify } from './db'
import { uid } from './utils'
import type { ApplicationStage, EmploymentType, InterviewRound, TeacherApplicant } from './types'

export const STAGES: { stage: ApplicationStage; label: string }[] = [
  { stage: 'applied', label: 'Applied' },
  { stage: 'screening', label: 'Screening' },
  { stage: 'interview', label: 'Interview' },
  { stage: 'offer', label: 'Offer' },
  { stage: 'hired', label: 'Hired' },
]

const STAGE_MSG: Record<ApplicationStage, string> = {
  applied: 'Your application has been received.',
  screening: 'Your application is being screened by our team.',
  interview: 'You have moved to the interview stage.',
  offer: 'Congratulations — an offer is being prepared for you!',
  hired: 'Welcome to Lighthouse! You have been hired.',
  rejected: 'Thank you for applying. We won\'t be moving forward at this time.',
}

async function notifyApplicant(applicant: TeacherApplicant, title: string, body: string) {
  const u = await db.users.where('email').equals(applicant.email.toLowerCase()).first()
  if (u) await notify(u.id, title, body, 'info', '/teacher/application')
}

export async function moveStage(applicant: TeacherApplicant, stage: ApplicationStage, admin: { id: string; name: string }) {
  await db.applicants.update(applicant.id, { stage, updatedAt: Date.now() })
  await notifyApplicant(applicant, 'Application update', STAGE_MSG[stage])
  await logAudit(admin.id, admin.name, 'move_applicant', applicant.id, `${applicant.stage} → ${stage}`)
}

/** Teacher edits their own applicant profile (subject, quals, experience, etc.). */
export async function updateApplicantProfile(
  applicant: TeacherApplicant,
  patch: Partial<Pick<TeacherApplicant, 'phone' | 'subject' | 'qualifications' | 'experienceYears' | 'coverNote'>>,
) {
  await db.applicants.update(applicant.id, { ...patch, updatedAt: Date.now() })
}

export async function addNote(applicant: TeacherApplicant, author: string, text: string) {
  const note = { id: uid('note'), author, text, at: Date.now() }
  await db.applicants.update(applicant.id, { recruiterNotes: [...applicant.recruiterNotes, note], updatedAt: Date.now() })
}

export async function setRating(applicant: TeacherApplicant, rating: number) {
  await db.applicants.update(applicant.id, { rating })
}

export async function scheduleInterview(
  applicant: TeacherApplicant,
  data: { scheduledAt: number; mode: InterviewRound['mode']; interviewer: string },
  admin: { id: string; name: string },
) {
  const round: InterviewRound = { id: uid('iv'), result: 'pending', ...data }
  await db.applicants.update(applicant.id, {
    interviews: [...applicant.interviews, round],
    stage: applicant.stage === 'applied' || applicant.stage === 'screening' ? 'interview' : applicant.stage,
    updatedAt: Date.now(),
  })
  await notifyApplicant(applicant, 'Interview scheduled', `An interview has been scheduled. Check your application for details.`)
  await logAudit(admin.id, admin.name, 'schedule_interview', applicant.id)
}

export async function setInterviewResult(applicant: TeacherApplicant, interviewId: string, result: InterviewRound['result'], notes: string) {
  const interviews = applicant.interviews.map((iv) => (iv.id === interviewId ? { ...iv, result, notes } : iv))
  await db.applicants.update(applicant.id, { interviews, updatedAt: Date.now() })
}

export async function rejectApplicant(applicant: TeacherApplicant, admin: { id: string; name: string }) {
  await db.applicants.update(applicant.id, { stage: 'rejected', updatedAt: Date.now() })
  await notifyApplicant(applicant, 'Application update', STAGE_MSG.rejected)
  await logAudit(admin.id, admin.name, 'reject_applicant', applicant.id)
}

export interface HireInput {
  designation: string
  department: string
  employmentType: EmploymentType
  monthlySalary: number
  joinDate: string
}

/** Hire an applicant: mark hired + create an HRMS employee record (Phase 6). */
export async function hireApplicant(applicant: TeacherApplicant, input: HireInput, admin: { id: string; name: string }) {
  // link an existing teacher user account if one exists
  const account = await db.users.where('email').equals(applicant.email.toLowerCase()).first()
  const empId = uid('emp')
  await db.employees.add({
    id: empId,
    userId: account?.id,
    name: applicant.name,
    email: applicant.email,
    phone: applicant.phone,
    designation: input.designation || `${applicant.subject} Instructor`,
    department: input.department || 'Academy',
    employmentType: input.employmentType,
    status: 'active',
    joinDate: input.joinDate,
    monthlySalary: input.monthlySalary,
    managerId: 'emp_2',
    createdAt: Date.now(),
  })
  if (account) await db.users.update(account.id, { refId: empId })
  await db.applicants.update(applicant.id, { stage: 'hired', updatedAt: Date.now() })
  await notifyApplicant(applicant, '🎉 You are hired!', STAGE_MSG.hired)
  await logAudit(admin.id, admin.name, 'hire_applicant', applicant.id, input.designation)
  return empId
}
