// ---------------------------------------------------------------------------
// Advanced analytics & forecasting (feature #8).
// 100% client-side heuristics computed from IndexedDB data — NO OpenAI, NO API
// keys, NO external calls. Forecasting uses moving averages + week-over-week
// trend; risk scoring uses transparent weighted signals; insight cards are
// generated from templates filled with the computed numbers.
// ---------------------------------------------------------------------------

import type {
  Attendance,
  Employee,
  Job,
  LeaveRequest,
  ServiceCategory,
  Student,
  DocumentRecord,
} from './types'

const WEEK = 7 * 24 * 60 * 60 * 1000

// --- Demand forecasting -----------------------------------------------------

export interface CategoryDemand {
  categoryId: string
  name: string
  thisWeek: number
  lastWeek: number
  changePct: number // week-over-week % change
  forecastNext: number // projected next-week bookings
  total: number
}

/**
 * Weekly demand per category from job scheduling, with a moving-average forecast.
 * `now` is passed in (components have a real clock) to keep this pure/testable.
 */
export function demandForecast(
  jobs: Job[],
  categories: ServiceCategory[],
  now: number,
): CategoryDemand[] {
  const catName = new Map(categories.map((c) => [c.id, c.name]))
  const inWeek = (ts: number, w: number) => ts <= now - w * WEEK && ts > now - (w + 1) * WEEK
  const out: CategoryDemand[] = []
  for (const c of categories) {
    const catJobs = jobs.filter((j) => j.categoryId === c.id)
    const ts = (j: Job) => j.scheduledAt || j.createdAt
    const thisWeek = catJobs.filter((j) => inWeek(ts(j), 0)).length
    const lastWeek = catJobs.filter((j) => inWeek(ts(j), 1)).length
    const w2 = catJobs.filter((j) => inWeek(ts(j), 2)).length
    // 3-week moving average + linear trend for a smoothed forecast.
    const avg = (thisWeek + lastWeek + w2) / 3
    const trend = thisWeek - lastWeek
    const forecastNext = Math.max(0, Math.round(avg * 0.5 + (thisWeek + trend) * 0.5))
    const changePct = lastWeek === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    out.push({
      categoryId: c.id,
      name: catName.get(c.id) ?? c.id,
      thisWeek,
      lastWeek,
      changePct,
      forecastNext,
      total: catJobs.length,
    })
  }
  return out.sort((a, b) => b.total - a.total)
}

// --- Attrition risk (HRMS) --------------------------------------------------

export type RiskLevel = 'low' | 'medium' | 'high'

export interface AttritionRisk {
  employee: Employee
  score: number // 0..100
  level: RiskLevel
  reasons: string[]
}

export function attritionRisk(
  employees: Employee[],
  leaves: LeaveRequest[],
  attendance: Attendance[],
  now: number,
): AttritionRisk[] {
  const active = employees.filter((e) => e.status !== 'terminated')
  const results = active.map((e) => {
    const reasons: string[] = []
    let score = 0

    // Recent leave frequency (last 90 days).
    const recentLeaves = leaves.filter((l) => l.employeeId === e.id && l.createdAt > now - 90 * 24 * 60 * 60 * 1000)
    if (recentLeaves.length >= 3) {
      score += 35
      reasons.push(`${recentLeaves.length} leave requests in 90 days`)
    } else if (recentLeaves.length === 2) {
      score += 18
      reasons.push('2 recent leave requests')
    }

    // Absences on record.
    const absences = attendance.filter((a) => a.employeeId === e.id && a.status === 'absent').length
    if (absences >= 2) {
      score += 25
      reasons.push(`${absences} recorded absences`)
    } else if (absences === 1) {
      score += 10
      reasons.push('1 recorded absence')
    }

    // Currently on leave.
    if (e.status === 'on_leave') {
      score += 15
      reasons.push('Currently on leave')
    }

    // Tenure: newer joiners churn more.
    const joinTs = Date.parse(e.joinDate)
    if (!Number.isNaN(joinTs)) {
      const months = (now - joinTs) / (30 * 24 * 60 * 60 * 1000)
      if (months < 6) {
        score += 20
        reasons.push('Joined < 6 months ago')
      } else if (months < 12) {
        score += 8
      }
    }

    // Contract employees carry inherent renewal risk.
    if (e.employmentType === 'contract') {
      score += 12
      reasons.push('Contract role')
    }

    score = Math.min(100, score)
    const level: RiskLevel = score >= 55 ? 'high' : score >= 30 ? 'medium' : 'low'
    if (!reasons.length) reasons.push('Stable — no risk signals')
    return { employee: e, score, level, reasons }
  })
  return results.sort((a, b) => b.score - a.score)
}

// --- Verification funnel ----------------------------------------------------

export interface FunnelStage {
  label: string
  count: number
  dropFromPrev: number // % dropped vs previous stage
}

export function verificationFunnel(students: Student[], documents: DocumentRecord[]): FunnelStage[] {
  const withDocs = new Set(documents.map((d) => d.ownerId))
  const registered = students.length
  const uploaded = students.filter((s) => withDocs.has(s.id)).length
  const submitted = students.filter((s) => ['pending', 'verified', 'rejected'].includes(s.verificationStatus)).length
  const verified = students.filter((s) => s.verificationStatus === 'verified').length

  const stages = [
    { label: 'Registered', count: registered },
    { label: 'Uploaded documents', count: uploaded },
    { label: 'Submitted for review', count: submitted },
    { label: 'Verified', count: verified },
  ]
  return stages.map((s, i) => {
    const prev = i === 0 ? s.count : stages[i - 1].count
    const dropFromPrev = prev === 0 ? 0 : Math.round(((prev - s.count) / prev) * 100)
    return { ...s, dropFromPrev }
  })
}

// --- Plain-English insight cards -------------------------------------------

export type InsightTone = 'brand' | 'green' | 'amber' | 'red' | 'purple'
export interface Insight {
  id: string
  icon: 'trend-up' | 'trend-down' | 'alert' | 'check' | 'info'
  tone: InsightTone
  title: string
  detail: string
}

export function marketplaceInsights(
  jobs: Job[],
  categories: ServiceCategory[],
  students: Student[],
  documents: DocumentRecord[],
  now: number,
): Insight[] {
  const out: Insight[] = []
  const demand = demandForecast(jobs, categories, now)

  const rising = [...demand].filter((d) => d.thisWeek > 0).sort((a, b) => b.changePct - a.changePct)[0]
  if (rising && rising.changePct > 0) {
    out.push({
      id: 'demand-up',
      icon: 'trend-up',
      tone: 'green',
      title: `${rising.name} demand is up ${rising.changePct}%`,
      detail: `${rising.thisWeek} bookings this week vs ${rising.lastWeek} last week. Forecast next week: ${rising.forecastNext}.`,
    })
  }
  const falling = [...demand].filter((d) => d.lastWeek > 0).sort((a, b) => a.changePct - b.changePct)[0]
  if (falling && falling.changePct < 0) {
    out.push({
      id: 'demand-down',
      icon: 'trend-down',
      tone: 'amber',
      title: `${falling.name} demand cooled ${Math.abs(falling.changePct)}%`,
      detail: `Consider promoting ${falling.name.toLowerCase()} pros or running an offer.`,
    })
  }

  const funnel = verificationFunnel(students, documents)
  const worst = funnel.slice(1).sort((a, b) => b.dropFromPrev - a.dropFromPrev)[0]
  if (worst && worst.dropFromPrev >= 20) {
    out.push({
      id: 'funnel-drop',
      icon: 'alert',
      tone: 'red',
      title: `${worst.dropFromPrev}% drop-off at “${worst.label}”`,
      detail: 'This is the biggest leak in the verification funnel — a nudge here lifts verified supply.',
    })
  }

  const availableNow = students.filter((s) => s.availability === 'available' && s.verificationStatus === 'verified').length
  out.push({
    id: 'supply',
    icon: 'info',
    tone: 'brand',
    title: `${availableNow} verified pros available now`,
    detail: `Out of ${students.filter((s) => s.verificationStatus === 'verified').length} verified on the platform.`,
  })

  return out
}

export function hrInsights(
  employees: Employee[],
  leaves: LeaveRequest[],
  attendance: Attendance[],
  now: number,
): Insight[] {
  const out: Insight[] = []
  const risks = attritionRisk(employees, leaves, attendance, now)
  const high = risks.filter((r) => r.level === 'high')
  if (high.length) {
    // Which department carries the most risk?
    const byDept = new Map<string, number>()
    high.forEach((r) => byDept.set(r.employee.department, (byDept.get(r.employee.department) ?? 0) + 1))
    const topDept = [...byDept.entries()].sort((a, b) => b[1] - a[1])[0]
    out.push({
      id: 'attrition',
      icon: 'alert',
      tone: 'red',
      title: `${high.length} employee${high.length > 1 ? 's' : ''} at high attrition risk`,
      detail: topDept ? `Concentrated in ${topDept[0]} — schedule stay-interviews this week.` : 'Review flagged employees below.',
    })
  } else {
    out.push({
      id: 'attrition-ok',
      icon: 'check',
      tone: 'green',
      title: 'Retention looks healthy',
      detail: 'No employees are currently flagged as high attrition risk.',
    })
  }

  const pending = leaves.filter((l) => l.status === 'pending').length
  if (pending) {
    out.push({
      id: 'leaves',
      icon: 'info',
      tone: 'amber',
      title: `${pending} leave request${pending > 1 ? 's' : ''} awaiting approval`,
      detail: 'Approve promptly to keep scheduling predictable.',
    })
  }

  const contractShare = Math.round(
    (employees.filter((e) => e.status !== 'terminated' && e.employmentType === 'contract').length /
      Math.max(1, employees.filter((e) => e.status !== 'terminated').length)) * 100,
  )
  out.push({
    id: 'contract-mix',
    icon: 'info',
    tone: 'brand',
    title: `${contractShare}% of the team is on contract`,
    detail: 'Watch renewal timelines to avoid capacity gaps.',
  })

  return out
}
