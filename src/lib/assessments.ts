// ---------------------------------------------------------------------------
// Skill assessments, certificates & gamified career tiers (feature #6).
// Quiz content is static and bundled — no server. Passing a quiz issues a
// certificate (stored as an AssessmentResult) and awards skill points that
// drive the student's career tier.
// ---------------------------------------------------------------------------

import { db, logAudit, notify } from './db'
import { uid } from './utils'
import type { AssessmentResult, Student } from './types'

export interface Question {
  q: string
  options: string[]
  answer: number // index into options
}

export interface Quiz {
  id: string
  categoryId?: string // undefined = general, applies to everyone
  title: string
  skill: string // skill badge awarded on pass
  icon: string // lucide icon name
  passScore: number // percentage required to pass
  questions: Question[]
}

export const QUIZZES: Quiz[] = [
  {
    id: 'quiz_safety',
    title: 'Workplace Safety & Conduct',
    skill: 'Certified Safe Worker',
    icon: 'ShieldCheck',
    passScore: 70,
    questions: [
      {
        q: 'A customer asks you to start work before the security check-in is complete. You should:',
        options: [
          'Skip the check-in to save time',
          'Complete the selfie + OTP verification first, then start',
          'Start and verify later',
          'Refuse the whole job',
        ],
        answer: 1,
      },
      {
        q: 'You notice an unsafe electrical wire at the site. The best action is to:',
        options: ['Ignore it', 'Inform the customer and note it before proceeding safely', 'Cut it yourself', 'Leave immediately'],
        answer: 1,
      },
      {
        q: 'What is the SOS button on your Active Work screen for?',
        options: ['Ordering food', 'Ending the job', 'Raising an emergency alert to Lighthouse', 'Calling the customer'],
        answer: 2,
      },
      {
        q: 'How should you handle a customer’s personal belongings?',
        options: ['Move them without asking', 'Treat them with care and only touch what the task requires', 'Take photos for fun', 'Borrow them'],
        answer: 1,
      },
      {
        q: 'Professional conduct means:',
        options: ['Arriving late is fine', 'Being punctual, polite, and wearing clean attire', 'Arguing over price on site', 'Skipping the wrap-up'],
        answer: 1,
      },
    ],
  },
  {
    id: 'quiz_clean',
    categoryId: 'cat_clean',
    title: 'Home Cleaning Fundamentals',
    skill: 'Deep-Clean Certified',
    icon: 'Sparkles',
    passScore: 70,
    questions: [
      { q: 'Which is safest for cleaning a wooden surface?', options: ['Harsh bleach', 'Mild soap + damp cloth', 'Metal scrubber', 'Boiling water'], answer: 1 },
      { q: 'You should NEVER mix bleach with:', options: ['Water', 'Ammonia-based cleaners', 'A bucket', 'A mop'], answer: 1 },
      { q: 'Best order to clean a room:', options: ['Floor then dusting', 'Top to bottom (dust high, mop last)', 'Random', 'Only the visible parts'], answer: 1 },
      { q: 'For a kitchen deep clean you should prioritise:', options: ['Only the floor', 'Grease on surfaces, chimney and sink hygiene', 'Nothing', 'Just the windows'], answer: 1 },
    ],
  },
  {
    id: 'quiz_electric',
    categoryId: 'cat_electric',
    title: 'Electrical Safety Basics',
    skill: 'Electrical Safety Certified',
    icon: 'Zap',
    passScore: 75,
    questions: [
      { q: 'Before working on a switchboard you must:', options: ['Wear wet gloves', 'Turn off the mains supply', 'Work faster', 'Nothing'], answer: 1 },
      { q: 'A live wire should be tested with:', options: ['Your finger', 'A tester/multimeter', 'Water', 'A metal rod'], answer: 1 },
      { q: 'The correct wire colour for earth (India) is usually:', options: ['Red', 'Black', 'Green', 'Blue'], answer: 2 },
      { q: 'If you smell burning while working, you should:', options: ['Continue', 'Cut power and investigate safely', 'Pour water', 'Ignore it'], answer: 1 },
    ],
  },
  {
    id: 'quiz_plumb',
    categoryId: 'cat_plumb',
    title: 'Plumbing Essentials',
    skill: 'Plumbing Certified',
    icon: 'Wrench',
    passScore: 70,
    questions: [
      { q: 'First step before fixing a leaking tap:', options: ['Open all taps', 'Shut the water supply valve', 'Break the pipe', 'Call the customer’s neighbour'], answer: 1 },
      { q: 'PTFE (Teflon) tape is used to:', options: ['Decorate pipes', 'Seal threaded joints against leaks', 'Colour water', 'Clean drains'], answer: 1 },
      { q: 'A slow drain is best cleared first with:', options: ['Acid immediately', 'A plunger or drain snake', 'A hammer', 'Nothing'], answer: 1 },
      { q: 'To avoid water damage you should:', options: ['Leave joints loose', 'Check for leaks after finishing and dry the area', 'Skip testing', 'Rush out'], answer: 1 },
    ],
  },
  {
    id: 'quiz_tutor',
    categoryId: 'cat_tutor',
    title: 'Effective Home Tutoring',
    skill: 'Certified Tutor',
    icon: 'GraduationCap',
    passScore: 70,
    questions: [
      { q: 'A student struggles with a concept. You should:', options: ['Move on quickly', 'Explain it a different way with examples', 'Blame the student', 'Give the answer only'], answer: 1 },
      { q: 'A good lesson plan includes:', options: ['No structure', 'Clear objective, practice, and a recap', 'Only lecturing', 'Only homework'], answer: 1 },
      { q: 'When alone with a minor you must:', options: ['Ignore safeguarding', 'Keep a professional, transparent environment (door open / guardian aware)', 'Take the child out', 'Nothing'], answer: 1 },
      { q: 'Progress is best tracked by:', options: ['Guessing', 'Regular short assessments and feedback', 'Never testing', 'Only final exam'], answer: 1 },
    ],
  },
  {
    id: 'quiz_beauty',
    categoryId: 'cat_beauty',
    title: 'Beauty & Hygiene Standards',
    skill: 'Hygiene Certified',
    icon: 'Scissors',
    passScore: 70,
    questions: [
      { q: 'Tools between clients must be:', options: ['Reused as-is', 'Sanitised/sterilised', 'Thrown away always', 'Wiped on a towel'], answer: 1 },
      { q: 'Before a facial you should check for:', options: ['Nothing', 'Skin allergies/sensitivities', 'The customer’s wallet', 'The time only'], answer: 1 },
      { q: 'Single-use items like razors should be:', options: ['Reused', 'Discarded after one client', 'Shared', 'Washed and reused'], answer: 1 },
      { q: 'Good hygiene means:', options: ['Dirty hands', 'Clean hands, fresh disposables, sanitised station', 'No gloves ever', 'Skipping cleanup'], answer: 1 },
    ],
  },
  {
    id: 'quiz_cook',
    categoryId: 'cat_cook',
    title: 'Food Safety & Hygiene',
    skill: 'Food-Safety Certified',
    icon: 'ChefHat',
    passScore: 75,
    questions: [
      { q: 'Raw and cooked food should be:', options: ['Stored together', 'Kept separate to avoid cross-contamination', 'Mixed', 'Left out'], answer: 1 },
      { q: 'Hands must be washed:', options: ['Never', 'Before cooking and after handling raw meat', 'Once a day', 'Only after'], answer: 1 },
      { q: 'Perishable food is safe when stored:', options: ['In sunlight', 'Refrigerated below 5°C', 'On the counter for hours', 'Anywhere'], answer: 1 },
      { q: 'You should ask the customer about:', options: ['Nothing', 'Allergies and dietary restrictions', 'Their salary', 'Their neighbours'], answer: 1 },
    ],
  },
  {
    id: 'quiz_care',
    categoryId: 'cat_care',
    title: 'Elder & Child Care Basics',
    skill: 'Care Certified',
    icon: 'HeartHandshake',
    passScore: 75,
    questions: [
      { q: 'If an elderly person falls, you should first:', options: ['Move them quickly', 'Check for injury and call for help before moving', 'Ignore', 'Leave'], answer: 1 },
      { q: 'Medication should be given:', options: ['As you guess', 'Exactly as prescribed / per family instruction', 'Extra to be safe', 'Never'], answer: 1 },
      { q: 'A child in your care must never be:', options: ['Supervised', 'Left unattended near water or stairs', 'Fed', 'Comforted'], answer: 1 },
      { q: 'Emergency contact details should be:', options: ['Forgotten', 'Known and kept handy', 'Ignored', 'Secret'], answer: 1 },
    ],
  },
  {
    id: 'quiz_paint',
    categoryId: 'cat_paint',
    title: 'Painting & Repair Craft',
    skill: 'Finishing Certified',
    icon: 'PaintRoller',
    passScore: 70,
    questions: [
      { q: 'Before painting a wall you should:', options: ['Paint over dust', 'Clean, patch and prime the surface', 'Skip prep', 'Wet it fully'], answer: 1 },
      { q: 'To protect the customer’s floor you should:', options: ['Nothing', 'Use drop cloths / masking', 'Paint fast', 'Move furniture outside'], answer: 1 },
      { q: 'Two coats are usually applied to:', options: ['Waste paint', 'Get even coverage and durability', 'Look busy', 'Dry faster'], answer: 1 },
      { q: 'After finishing you should:', options: ['Leave the mess', 'Clean tools and the work area', 'Take the paint home', 'Nothing'], answer: 1 },
    ],
  },
]

export function quizById(id: string) {
  return QUIZZES.find((q) => q.id === id)
}

/** Quizzes relevant to a student: the general one + those for their categories. */
export function quizzesForStudent(student: Student) {
  return QUIZZES.filter((q) => !q.categoryId || student.serviceCategoryIds.includes(q.categoryId))
}

/** Grade answers and, on a pass, issue a certificate + award skill points. */
export async function submitAssessment(
  student: Student,
  quiz: Quiz,
  answers: number[],
): Promise<AssessmentResult> {
  const correct = quiz.questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0)
  const total = quiz.questions.length
  const score = Math.round((correct / total) * 100)
  const passed = score >= quiz.passScore

  const result: AssessmentResult = {
    id: uid('asmt'),
    studentId: student.id,
    quizId: quiz.id,
    quizTitle: quiz.title,
    skill: quiz.skill,
    categoryId: quiz.categoryId,
    score,
    correct,
    total,
    passed,
    takenAt: Date.now(),
  }
  // Keep only the best attempt per quiz.
  const prior = await db.assessments.where('studentId').equals(student.id).and((r) => r.quizId === quiz.id).toArray()
  const priorBest = prior.reduce((m, r) => Math.max(m, r.score), 0)
  await Promise.all(prior.map((r) => db.assessments.delete(r.id)))
  await db.assessments.add(result)

  if (passed && priorBest < quiz.passScore) {
    // First time passing this quiz — award badge + points.
    const skills = student.skills.includes(quiz.skill) ? student.skills : [...student.skills, quiz.skill]
    const certifiedCategoryIds = quiz.categoryId
      ? Array.from(new Set([...(student.certifiedCategoryIds ?? []), quiz.categoryId]))
      : student.certifiedCategoryIds ?? []
    await db.students.update(student.id, {
      skills,
      certificateCount: (student.certificateCount ?? 0) + 1,
      certifiedCategoryIds,
      skillPoints: (student.skillPoints ?? 0) + 50,
    })
    await notify(student.userId, 'Certificate earned! 🎉', `You passed "${quiz.title}" and earned the ${quiz.skill} badge.`, 'success', '/student/skills')
    await logAudit(student.userId, student.name, 'earn_certificate', quiz.id, quiz.skill)
  }
  return result
}

// ---------------------------------------------------------------------------
// Career tiers
// ---------------------------------------------------------------------------

export type CareerTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum'

const TIER_STEPS: { tier: CareerTier; at: number; color: string }[] = [
  { tier: 'Bronze', at: 0, color: '#b45309' },
  { tier: 'Silver', at: 150, color: '#64748b' },
  { tier: 'Gold', at: 400, color: '#d97706' },
  { tier: 'Platinum', at: 900, color: '#0ea5e9' },
]

/** Total career points from jobs, reviews and certificates. */
export function careerPoints(student: Student) {
  const fromJobs = student.jobsCompleted * 10
  const fromReviews = Math.round(student.rating * student.ratingCount * 2)
  const fromCerts = (student.certificateCount ?? 0) * 50
  return fromJobs + fromReviews + fromCerts
}

export interface TierInfo {
  tier: CareerTier
  color: string
  points: number
  next: { tier: CareerTier; at: number } | null
  progress: number // 0..1 toward next tier
  pointsToNext: number
}

export function tierInfo(student: Student): TierInfo {
  const points = careerPoints(student)
  let idx = 0
  for (let i = TIER_STEPS.length - 1; i >= 0; i--) {
    if (points >= TIER_STEPS[i].at) {
      idx = i
      break
    }
  }
  const current = TIER_STEPS[idx]
  const next = TIER_STEPS[idx + 1] ?? null
  const span = next ? next.at - current.at : 1
  const progress = next ? Math.min(1, (points - current.at) / span) : 1
  return {
    tier: current.tier,
    color: current.color,
    points,
    next: next ? { tier: next.tier, at: next.at } : null,
    progress,
    pointsToNext: next ? Math.max(0, next.at - points) : 0,
  }
}
