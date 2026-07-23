import type { Student } from './types'

export interface StrengthItem {
  key: string
  label: string
  weight: number
  met: boolean
  tip: string
}

export interface ProfileStrength {
  score: number // 0..100
  items: StrengthItem[]
  tone: 'red' | 'amber' | 'green'
  label: string
}

/**
 * Scores how complete/attractive a student's marketplace profile is and returns
 * actionable coaching tips. A stronger profile ranks higher in Smart-Match and
 * converts more bookings.
 */
export function computeProfileStrength(student: Student): ProfileStrength {
  const hasUploadedPhoto = !!student.photoUrl?.startsWith('data:')
  const items: StrengthItem[] = [
    { key: 'photo', label: 'Real profile photo', weight: 15, met: hasUploadedPhoto, tip: 'Add a clear headshot — it also powers check-in face-match.' },
    { key: 'bio', label: 'Bio (30+ characters)', weight: 15, met: (student.bio?.trim().length ?? 0) >= 30, tip: 'Write a short intro about your experience.' },
    { key: 'skills', label: 'At least 3 skills', weight: 15, met: student.skills.length >= 3, tip: `Add ${Math.max(0, 3 - student.skills.length)} more skill${3 - student.skills.length === 1 ? '' : 's'} to appear in more searches.` },
    { key: 'categories', label: 'A service category', weight: 10, met: student.serviceCategoryIds.length >= 1, tip: 'Pick the services you offer so customers can find you.' },
    { key: 'verified', label: 'Verified badge', weight: 20, met: student.verificationStatus === 'verified', tip: 'Complete verification — verified pros are booked far more often.' },
    { key: 'availability', label: 'Weekly availability set', weight: 10, met: Object.values(student.weeklyAvailability ?? {}).some((s) => s.length > 0), tip: 'Set your available time slots so customers can book you.' },
    { key: 'certificate', label: 'A skill certificate', weight: 10, met: (student.certificateCount ?? 0) > 0, tip: 'Pass a skill assessment to earn a certificate and rank higher.' },
    { key: 'rate', label: 'Hourly rate set', weight: 5, met: student.hourlyRate > 0, tip: 'Set a fair hourly rate.' },
  ]
  const score = items.reduce((sum, i) => sum + (i.met ? i.weight : 0), 0)
  const tone = score >= 85 ? 'green' : score >= 60 ? 'amber' : 'red'
  const label = score >= 85 ? 'Excellent' : score >= 60 ? 'Good — a few tweaks left' : 'Needs work'
  return { score, items, tone, label }
}
