// ---------------------------------------------------------------------------
// Shared domain types for the Lighthouse platform.
// String-literal unions are used instead of TS enums (erasableSyntaxOnly).
// ---------------------------------------------------------------------------

export type Role = 'customer' | 'student' | 'teacher' | 'admin' | 'employee'

export interface User {
  id: string
  role: Role
  name: string
  email: string
  phone: string
  password: string // mock only — never do this in production
  avatarUrl?: string
  refId?: string // links to Student / Employee / TeacherApplicant record
  createdAt: number
}

// ---------------------------------------------------------------------------
// Verification & documents
// ---------------------------------------------------------------------------

export type DocType = 'aadhaar' | 'marksheet' | 'photo' | 'address_proof' | 'resume'
export type DocStatus = 'pending' | 'approved' | 'rejected'

export interface DocumentRecord {
  id: string
  ownerId: string // studentId or applicantId
  type: DocType
  label: string
  fileName: string
  dataUrl: string // base64 preview (image or pdf placeholder)
  status: DocStatus
  reviewNote?: string
  uploadedAt: number
  reviewedAt?: number
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type BadgeTier = 'none' | 'basic' | 'verified' | 'premium'
export type Availability = 'available' | 'busy' | 'offline'

// ---------------------------------------------------------------------------
// Student (academy graduate / marketplace worker)
// ---------------------------------------------------------------------------

export interface Student {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  photoUrl: string
  bio: string
  academyBatch: string
  graduationDate: string
  skills: string[]
  serviceCategoryIds: string[]
  neighbourhood: string
  city: string
  lat: number
  lng: number
  serviceRadiusKm: number
  hourlyRate: number
  availability: Availability
  verificationStatus: VerificationStatus
  badgeTier: BadgeTier
  rating: number
  ratingCount: number
  jobsCompleted: number
  verifiedAt?: number
  // Skill assessments & gamification (feature #6)
  certificateCount?: number
  certifiedCategoryIds?: string[]
  skillPoints?: number
  // Weekly availability: weekday (0=Sun..6=Sat, as string) → allowed slot times ("HH:mm")
  weeklyAvailability?: Record<string, string[]>
  createdAt: number
}

// ---------------------------------------------------------------------------
// Skill assessments & certificates (feature #6)
// ---------------------------------------------------------------------------

export interface AssessmentResult {
  id: string
  studentId: string
  quizId: string
  quizTitle: string
  skill: string
  categoryId?: string
  score: number // 0..100
  correct: number
  total: number
  passed: boolean
  takenAt: number
}

// ---------------------------------------------------------------------------
// Marketplace: categories, jobs, work sessions
// ---------------------------------------------------------------------------

export interface ServiceCategory {
  id: string
  name: string
  icon: string // lucide icon name
  description: string
  basePrice: number
}

export type JobStatus =
  | 'requested'
  | 'assigned'
  | 'accepted'
  | 'declined'
  | 'en_route'
  | 'verifying'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type PaymentStatus = 'unpaid' | 'in_escrow' | 'released' | 'refunded'
export type PaymentMethod = 'card' | 'wallet' | 'upi'

export interface Job {
  id: string
  customerId: string
  studentId?: string
  categoryId: string
  title: string
  description: string
  address: string
  neighbourhood: string
  city: string
  lat: number
  lng: number
  scheduledAt: number
  durationHours: number
  estimatedPrice: number
  status: JobStatus
  workSessionId?: string
  customerRating?: number
  customerReview?: string
  studentRating?: number
  studentReview?: string
  // Payments & escrow (simulated gateway — funds held until job completion)
  paymentStatus?: PaymentStatus
  escrowAmount?: number
  paymentMethod?: PaymentMethod
  paidAt?: number
  createdAt: number
}

export type WorkSessionStatus = 'pre_check' | 'active' | 'paused' | 'ended'

export interface GeoPoint {
  lat: number
  lng: number
  t: number
}

export interface WorkSession {
  id: string
  jobId: string
  studentId: string
  status: WorkSessionStatus
  // pre-work verification gate
  selfieDataUrl?: string
  selfieVerified: boolean
  livenessScore?: number // 0..100, on-device liveness confidence (feature #1)
  faceMatchScore?: number | null // 0..100 vs profile photo, null if no reference
  micGranted: boolean
  otp?: string
  otpVerified: boolean
  // Doorstep identity handshake — customer confirms the pro at their door by
  // matching the verify-in selfie and entering this short code the pro shows.
  doorstepPin?: string
  doorstepVerifiedAt?: number
  geofenceOk: boolean
  distanceMeters?: number
  // live tracking
  startLat?: number
  startLng?: number
  locationTrail: GeoPoint[]
  startedAt?: number
  endedAt?: number
  elapsedSeconds: number
  sosTriggered: boolean
  createdAt: number
}

// ---------------------------------------------------------------------------
// Teacher hiring (ATS)
// ---------------------------------------------------------------------------

export type ApplicationStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'

export interface InterviewRound {
  id: string
  scheduledAt: number
  mode: 'online' | 'in_person'
  interviewer: string
  notes?: string
  result?: 'pending' | 'pass' | 'fail'
}

export interface TeacherApplicant {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  qualifications: string
  experienceYears: number
  coverNote: string
  stage: ApplicationStage
  interviews: InterviewRound[]
  recruiterNotes: { id: string; author: string; text: string; at: number }[]
  rating: number
  appliedAt: number
  updatedAt: number
}

// ---------------------------------------------------------------------------
// HRMS
// ---------------------------------------------------------------------------

export type EmploymentType = 'full_time' | 'part_time' | 'contract'
export type EmployeeStatus = 'active' | 'on_leave' | 'terminated'

export interface Employee {
  id: string
  userId?: string
  name: string
  email: string
  phone: string
  designation: string
  department: string
  employmentType: EmploymentType
  status: EmployeeStatus
  joinDate: string
  monthlySalary: number
  managerId?: string
  createdAt: number
}

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'wfh'

export interface Attendance {
  id: string
  employeeId: string
  date: string // YYYY-MM-DD
  checkIn?: string
  checkOut?: string
  status: AttendanceStatus
}

/**
 * An employee-raised request to correct/regularize an attendance record for a
 * given date (missed punch, wrong status, WFH approval). Mirrors the leave
 * apply→approve workflow; on approval it writes through to the Attendance row.
 */
export type AttendanceRequestStatus = 'pending' | 'approved' | 'rejected'

export interface AttendanceRequest {
  id: string
  employeeId: string
  date: string // YYYY-MM-DD the correction applies to
  requestedStatus: AttendanceStatus
  checkIn?: string
  checkOut?: string
  reason: string
  status: AttendanceRequestStatus
  approverId?: string
  createdAt: number
}

export type LeaveType = 'casual' | 'sick' | 'earned' | 'unpaid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

/**
 * A self-service leave / attendance-regularization request raised by a student
 * (gig pro) or teacher, reviewed & approved by the admin. Keyed by the
 * applicant's user id (they are not HRMS `Employee`s).
 */
export type WorkforceRequestKind = 'leave' | 'regularization'
export type WorkforceApplicantRole = 'student' | 'teacher'

export interface WorkforceRequest {
  id: string
  applicantId: string // user.id
  applicantName: string
  applicantRole: WorkforceApplicantRole
  kind: WorkforceRequestKind
  // leave fields
  leaveType?: LeaveType
  from?: string
  to?: string
  // regularization fields
  date?: string
  requestedStatus?: AttendanceStatus
  checkIn?: string
  checkOut?: string
  reason: string
  status: LeaveStatus
  approverId?: string
  approverName?: string
  createdAt: number
}

export interface LeaveRequest {
  id: string
  employeeId: string
  type: LeaveType
  from: string
  to: string
  reason: string
  status: LeaveStatus
  approverId?: string
  createdAt: number
}

export type PayrollStatus = 'draft' | 'processed' | 'paid'

export interface PayrollRecord {
  id: string
  employeeId: string
  month: string // YYYY-MM
  base: number
  allowances: number
  deductions: number
  net: number
  status: PayrollStatus
}

// ---------------------------------------------------------------------------
// Cross-cutting
// ---------------------------------------------------------------------------

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  type: 'info' | 'success' | 'warning' | 'action'
  read: boolean
  link?: string
  createdAt: number
}

export interface AuditLog {
  id: string
  actorId: string
  actorName: string
  action: string
  target: string
  meta?: string
  createdAt: number
}

/** Admin broadcast to a role audience; fans out as a notification per user. */
export type AnnouncementAudience = 'all' | 'students' | 'customers' | 'teachers'

export interface Announcement {
  id: string
  title: string
  body: string
  audience: AnnouncementAudience
  sentById: string
  sentByName: string
  recipientCount: number
  createdAt: number
}

// ---------------------------------------------------------------------------
// Incident & dispute center
// ---------------------------------------------------------------------------

export type IncidentType = 'sos' | 'dispute' | 'complaint'
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'dismissed'
export type IncidentPriority = 'high' | 'medium' | 'low'

export interface IncidentCase {
  id: string
  type: IncidentType
  jobId?: string
  raisedById: string
  raisedByName: string
  raisedByRole: Role
  againstName?: string // the other party involved
  subject: string
  description: string
  status: IncidentStatus
  priority: IncidentPriority
  lat?: number
  lng?: number
  resolutionNote?: string
  createdAt: number
  updatedAt: number
}

// ---------------------------------------------------------------------------
// Wallet & payments (simulated gateway + escrow)
// ---------------------------------------------------------------------------

export type WalletTxnKind =
  | 'topup' // customer/user adds money
  | 'escrow_hold' // wallet-funded booking payment moved into escrow
  | 'payout' // escrow released to a pro on job completion
  | 'refund' // escrow returned to the customer
  | 'withdrawal' // pro withdraws earnings out

/** A single movement in a user's wallet ledger. Balance = sum of `amount`. */
export interface WalletTxn {
  id: string
  userId: string
  kind: WalletTxnKind
  amount: number // signed: credit (+) / debit (−), in INR
  note: string
  jobId?: string
  createdAt: number
}

// ---------------------------------------------------------------------------
// Voice calls (in-app calling service — signalling over BroadcastChannel)
// ---------------------------------------------------------------------------

export type CallOutcome = 'completed' | 'missed' | 'declined' | 'cancelled' | 'unavailable'

export interface CallLog {
  id: string
  jobId?: string
  callerId: string
  callerName: string
  calleeId: string
  calleeName: string
  outcome: CallOutcome
  durationSeconds: number
  createdAt: number
}

// ---------------------------------------------------------------------------
// In-app chat (feature #5)
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string
  threadId: string // deterministic per booking/pair (see chat.ts)
  jobId?: string
  senderId: string
  senderName: string
  senderRole: Role
  recipientId: string
  recipientName: string
  text: string
  readAt?: number
  createdAt: number
}
