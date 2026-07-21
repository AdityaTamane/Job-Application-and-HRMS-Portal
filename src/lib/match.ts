// ---------------------------------------------------------------------------
// AI Smart-Match engine — explainable, client-side ranking of students against
// a search/booking context. No server, no API keys: a transparent weighted
// scoring model whose factors are surfaced back to the user as "why" chips.
// ---------------------------------------------------------------------------

import type { BadgeTier, Student, VerificationStatus } from './types'
import { distanceMeters } from './utils'
import { NEIGHBOURHOODS } from './seed'

export interface MatchContext {
  categoryId?: string // selected service category ('all' or undefined = any)
  neighbourhood?: string // reference neighbourhood for proximity ('all' = any)
  query?: string // free-text skill/name query
}

export interface MatchFactor {
  key: 'skill' | 'proximity' | 'rating' | 'trust' | 'availability' | 'experience'
  /** 0..1 normalized contribution before weighting. */
  score: number
  /** Human-readable chip, shown only when this factor is a real positive. */
  label: string
  /** Whether to surface this factor as a highlight chip. */
  highlight: boolean
}

export interface MatchResult {
  score: number // 0..100
  factors: MatchFactor[]
  reasons: string[] // top highlight labels, best first
}

// Relative importance of each factor. Tuned so trust + fit dominate but a great
// rating or being close by can still move a candidate up.
const WEIGHTS = {
  skill: 0.26,
  proximity: 0.18,
  rating: 0.2,
  trust: 0.18,
  availability: 0.1,
  experience: 0.08,
}

const TRUST_BY_TIER: Record<BadgeTier, number> = { premium: 1, verified: 0.85, basic: 0.6, none: 0.3 }
const TRUST_BY_STATUS: Record<VerificationStatus, number> = {
  verified: 1,
  pending: 0.5,
  unverified: 0.3,
  rejected: 0,
}

const AVAIL_SCORE: Record<Student['availability'], number> = { available: 1, busy: 0.5, offline: 0.12 }

/** Distance → 0..1 proximity score. 0 km ≈ 1.0, ~10 km ≈ 0. */
function proximityScore(meters: number) {
  const km = meters / 1000
  return Math.max(0, Math.min(1, 1 - km / 10))
}

export function scoreStudent(student: Student, ctx: MatchContext): MatchResult {
  const factors: MatchFactor[] = []
  const q = (ctx.query ?? '').trim().toLowerCase()
  const qTerms = q ? q.split(/\s+/).filter(Boolean) : []

  // --- Skill / category fit ------------------------------------------------
  let skill = 0.55 // baseline for any candidate
  let skillLabel = ''
  const servesCategory = ctx.categoryId && ctx.categoryId !== 'all'
    ? student.serviceCategoryIds.includes(ctx.categoryId)
    : null
  if (servesCategory === true) {
    skill = 0.9
    skillLabel = 'Matches the service you need'
    // Certified in this exact category is the strongest skill signal.
    if (ctx.categoryId && (student.certifiedCategoryIds ?? []).includes(ctx.categoryId)) {
      skill = 1
      skillLabel = 'Certified in this skill'
    }
  } else if (servesCategory === false) {
    skill = 0.25
  }
  if (qTerms.length) {
    const hay = [student.name, ...student.skills].join(' ').toLowerCase()
    const hits = qTerms.filter((t) => hay.includes(t)).length
    if (hits) {
      skill = Math.min(1, skill + 0.15 * hits)
      const matched = student.skills.find((s) => qTerms.some((t) => s.toLowerCase().includes(t)))
      if (matched) skillLabel = `Skilled in ${matched}`
    }
  }
  factors.push({ key: 'skill', score: skill, label: skillLabel || 'Relevant skill set', highlight: skill >= 0.85 })

  // --- Proximity -----------------------------------------------------------
  let proximity = 0.7 // neutral when no reference neighbourhood
  let proxLabel = ''
  if (ctx.neighbourhood && ctx.neighbourhood !== 'all') {
    const ref = NEIGHBOURHOODS[ctx.neighbourhood]
    if (ref) {
      const meters = distanceMeters(ref, { lat: student.lat, lng: student.lng })
      proximity = proximityScore(meters)
      const km = meters / 1000
      proxLabel = km < 0.5 ? 'In your neighbourhood' : `${km.toFixed(1)} km away`
    }
  } else if (student.neighbourhood) {
    proxLabel = `Based in ${student.neighbourhood}`
  }
  factors.push({ key: 'proximity', score: proximity, label: proxLabel, highlight: proximity >= 0.8 && !!proxLabel })

  // --- Rating --------------------------------------------------------------
  const rating = student.ratingCount > 0 ? student.rating / 5 : 0.6
  factors.push({
    key: 'rating',
    score: rating,
    label: student.ratingCount > 0 ? `${student.rating.toFixed(1)}★ from ${student.ratingCount} reviews` : 'New to the platform',
    highlight: student.ratingCount > 0 && student.rating >= 4.5,
  })

  // --- Trust / verification ------------------------------------------------
  const trust = Math.min(TRUST_BY_TIER[student.badgeTier], TRUST_BY_STATUS[student.verificationStatus] || 0.3)
  factors.push({
    key: 'trust',
    score: trust,
    label:
      student.badgeTier === 'premium'
        ? 'Premium verified'
        : student.verificationStatus === 'verified'
          ? 'Background verified'
          : 'Verification in progress',
    highlight: student.verificationStatus === 'verified',
  })

  // --- Availability --------------------------------------------------------
  const availability = AVAIL_SCORE[student.availability]
  factors.push({
    key: 'availability',
    score: availability,
    label: student.availability === 'available' ? 'Available now' : '',
    highlight: student.availability === 'available',
  })

  // --- Experience ----------------------------------------------------------
  const experience = Math.min(1, student.jobsCompleted / 50)
  factors.push({
    key: 'experience',
    score: experience,
    label: student.jobsCompleted > 0 ? `${student.jobsCompleted} jobs completed` : '',
    highlight: student.jobsCompleted >= 25,
  })

  const raw = factors.reduce((sum, f) => sum + f.score * WEIGHTS[f.key], 0)
  const score = Math.round(raw * 100)

  const reasons = factors
    .filter((f) => f.highlight && f.label)
    .sort((a, b) => b.score * WEIGHTS[b.key] - a.score * WEIGHTS[a.key])
    .map((f) => f.label)

  return { score, factors, reasons }
}

/** Sort students by match score (desc), returning score alongside each. */
export function rankStudents(students: Student[], ctx: MatchContext) {
  return students
    .map((student) => ({ student, match: scoreStudent(student, ctx) }))
    .sort((a, b) => b.match.score - a.match.score)
}

/** Tailwind tone for a score band — used for the score pill. */
export function scoreTone(score: number): 'green' | 'blue' | 'amber' | 'gray' {
  if (score >= 85) return 'green'
  if (score >= 70) return 'blue'
  if (score >= 50) return 'amber'
  return 'gray'
}
