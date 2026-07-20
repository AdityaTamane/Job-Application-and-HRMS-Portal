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
  createdAt: number
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
  micGranted: boolean
  otp?: string
  otpVerified: boolean
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

export type LeaveType = 'casual' | 'sick' | 'earned' | 'unpaid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

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
