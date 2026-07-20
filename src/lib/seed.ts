import { db, notify } from './db'
import type {
  User,
  Student,
  ServiceCategory,
  Job,
  TeacherApplicant,
  Employee,
  Attendance,
  LeaveRequest,
  PayrollRecord,
  DocumentRecord,
} from './types'

// Base city: Bengaluru. Neighbourhoods with rough coordinates.
export const CITY = 'Bengaluru'
export const NEIGHBOURHOODS: Record<string, { lat: number; lng: number }> = {
  Koramangala: { lat: 12.9352, lng: 77.6245 },
  Indiranagar: { lat: 12.9719, lng: 77.6412 },
  'HSR Layout': { lat: 12.9116, lng: 77.6389 },
  Jayanagar: { lat: 12.9299, lng: 77.5826 },
  Whitefield: { lat: 12.9698, lng: 77.7499 },
  'JP Nagar': { lat: 12.906, lng: 77.5857 },
  Marathahalli: { lat: 12.9591, lng: 77.6974 },
  'BTM Layout': { lat: 12.9166, lng: 77.6101 },
}

const CATEGORIES: ServiceCategory[] = [
  { id: 'cat_clean', name: 'Home Cleaning', icon: 'Sparkles', description: 'Deep cleaning, kitchen & bathroom, sofa & carpet.', basePrice: 499 },
  { id: 'cat_electric', name: 'Electrician', icon: 'Zap', description: 'Wiring, switches, fans, appliance installation.', basePrice: 299 },
  { id: 'cat_plumb', name: 'Plumbing', icon: 'Wrench', description: 'Leaks, fittings, taps, drainage.', basePrice: 349 },
  { id: 'cat_tutor', name: 'Home Tutoring', icon: 'GraduationCap', description: 'School subjects, spoken English, computer basics.', basePrice: 400 },
  { id: 'cat_beauty', name: 'Beauty & Grooming', icon: 'Scissors', description: 'Salon at home, haircut, facial, mehndi.', basePrice: 599 },
  { id: 'cat_cook', name: 'Cooking & Catering', icon: 'ChefHat', description: 'Daily meals, party cooking, tiffin.', basePrice: 450 },
  { id: 'cat_care', name: 'Elder & Child Care', icon: 'HeartHandshake', description: 'Attendant, babysitting, companionship.', basePrice: 550 },
  { id: 'cat_paint', name: 'Painting & Repair', icon: 'PaintRoller', description: 'Wall painting, carpentry, minor repairs.', basePrice: 399 },
]

// tiny 1x1 transparent png as a stand-in document/selfie preview
const BLANK_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

interface StudentSeed {
  name: string
  neighbourhood: keyof typeof NEIGHBOURHOODS
  cats: string[]
  skills: string[]
  verification: Student['verificationStatus']
  badge: Student['badgeTier']
  rating: number
  ratingCount: number
  jobs: number
  rate: number
  avail: Student['availability']
  batch: string
}

const STUDENT_SEEDS: StudentSeed[] = [
  { name: 'Priya Sharma', neighbourhood: 'Koramangala', cats: ['cat_clean', 'cat_cook'], skills: ['Deep cleaning', 'North Indian cooking'], verification: 'verified', badge: 'premium', rating: 4.9, ratingCount: 128, jobs: 142, rate: 220, avail: 'available', batch: 'Batch 2024-A' },
  { name: 'Arjun Reddy', neighbourhood: 'Indiranagar', cats: ['cat_electric', 'cat_paint'], skills: ['Wiring', 'Appliance install', 'Wall painting'], verification: 'verified', badge: 'verified', rating: 4.7, ratingCount: 86, jobs: 94, rate: 260, avail: 'available', batch: 'Batch 2024-A' },
  { name: 'Fatima Khan', neighbourhood: 'HSR Layout', cats: ['cat_tutor'], skills: ['Maths', 'Science', 'Spoken English'], verification: 'verified', badge: 'verified', rating: 4.8, ratingCount: 64, jobs: 70, rate: 300, avail: 'busy', batch: 'Batch 2023-B' },
  { name: 'Ravi Kumar', neighbourhood: 'Jayanagar', cats: ['cat_plumb', 'cat_electric'], skills: ['Leak repair', 'Fittings'], verification: 'verified', badge: 'basic', rating: 4.5, ratingCount: 41, jobs: 48, rate: 240, avail: 'available', batch: 'Batch 2024-B' },
  { name: 'Sneha Patil', neighbourhood: 'Whitefield', cats: ['cat_beauty'], skills: ['Facial', 'Haircut', 'Mehndi'], verification: 'pending', badge: 'none', rating: 4.6, ratingCount: 22, jobs: 25, rate: 320, avail: 'available', batch: 'Batch 2024-B' },
  { name: 'Mohammed Ali', neighbourhood: 'Marathahalli', cats: ['cat_cook', 'cat_care'], skills: ['South Indian cooking', 'Elder care'], verification: 'pending', badge: 'none', rating: 0, ratingCount: 0, jobs: 0, rate: 210, avail: 'available', batch: 'Batch 2025-A' },
  { name: 'Lakshmi Nair', neighbourhood: 'JP Nagar', cats: ['cat_clean', 'cat_care'], skills: ['Babysitting', 'Home cleaning'], verification: 'unverified', badge: 'none', rating: 0, ratingCount: 0, jobs: 0, rate: 200, avail: 'offline', batch: 'Batch 2025-A' },
  { name: 'Vikram Singh', neighbourhood: 'BTM Layout', cats: ['cat_paint', 'cat_plumb'], skills: ['Carpentry', 'Minor repairs'], verification: 'rejected', badge: 'none', rating: 0, ratingCount: 0, jobs: 0, rate: 230, avail: 'offline', batch: 'Batch 2024-B' },
]

function pravatar(seed: number) {
  return `https://i.pravatar.cc/200?img=${seed}`
}

export async function isSeeded() {
  const count = await db.users.count()
  return count > 0
}

// Guard against concurrent runs (React StrictMode double-invokes effects).
let seedPromise: Promise<void> | null = null

export function seedDatabase(force = false) {
  if (!seedPromise || force) seedPromise = runSeed(force)
  return seedPromise
}

async function runSeed(force: boolean) {
  if (!force && (await isSeeded())) return
  if (force) {
    await Promise.all(db.tables.map((t) => t.clear()))
  }

  const now = Date.now()
  const day = 86400000

  // --- Categories ---
  await db.categories.bulkAdd(CATEGORIES)

  // --- Core users ---
  const users: User[] = [
    { id: 'u_admin', role: 'admin', name: 'Lighthouse Admin', email: 'admin@lighthouse.org', phone: '9000000001', password: 'admin123', avatarUrl: pravatar(12), createdAt: now },
    { id: 'u_cust1', role: 'customer', name: 'Anita Desai', email: 'customer@demo.com', phone: '9000000002', password: 'demo123', avatarUrl: pravatar(45), createdAt: now },
    { id: 'u_cust2', role: 'customer', name: 'Rahul Mehta', email: 'rahul@demo.com', phone: '9000000003', password: 'demo123', avatarUrl: pravatar(33), createdAt: now },
    { id: 'u_teacher', role: 'teacher', name: 'Deepa Iyer', email: 'deepa@mail.com', phone: '9811111111', password: 'demo123', avatarUrl: pravatar(48), refId: 'app_1', createdAt: now },
  ]

  // --- Students (+ their user accounts + documents) ---
  const students: Student[] = []
  const documents: DocumentRecord[] = []
  STUDENT_SEEDS.forEach((s, i) => {
    const sid = `stu_${i + 1}`
    const uidv = `u_stu_${i + 1}`
    const geo = NEIGHBOURHOODS[s.neighbourhood]
    const email = s.name.toLowerCase().split(' ')[0] + '@student.com'
    users.push({ id: uidv, role: 'student', name: s.name, email, phone: `98000000${10 + i}`, password: 'demo123', avatarUrl: pravatar(i + 20), refId: sid, createdAt: now })
    students.push({
      id: sid,
      userId: uidv,
      name: s.name,
      email,
      phone: `98000000${10 + i}`,
      photoUrl: pravatar(i + 20),
      bio: `Graduate of Lighthouse Academy (${s.batch}). Skilled in ${s.skills.join(', ')}.`,
      academyBatch: s.batch,
      graduationDate: '2024-06-30',
      skills: s.skills,
      serviceCategoryIds: s.cats,
      neighbourhood: s.neighbourhood,
      city: CITY,
      lat: geo.lat,
      lng: geo.lng,
      serviceRadiusKm: 6,
      hourlyRate: s.rate,
      availability: s.avail,
      verificationStatus: s.verification,
      badgeTier: s.badge,
      rating: s.rating,
      ratingCount: s.ratingCount,
      jobsCompleted: s.jobs,
      verifiedAt: s.verification === 'verified' ? now - day * 30 : undefined,
      createdAt: now - day * 40,
    })
    // documents — verified students have approved docs; pending have pending docs
    const docStatus = s.verification === 'verified' ? 'approved' : s.verification === 'rejected' ? 'rejected' : 'pending'
    const docDefs: { type: DocumentRecord['type']; label: string }[] = [
      { type: 'aadhaar', label: 'Aadhaar Card' },
      { type: 'marksheet', label: 'Highest Education Marksheet' },
      { type: 'photo', label: 'Passport Photo' },
    ]
    if (s.verification !== 'unverified') {
      docDefs.forEach((d, di) => {
        documents.push({
          id: `doc_${sid}_${di}`,
          ownerId: sid,
          type: d.type,
          label: d.label,
          fileName: `${d.type}_${s.name.split(' ')[0].toLowerCase()}.png`,
          dataUrl: BLANK_PNG,
          status: docStatus,
          reviewNote: docStatus === 'rejected' ? 'Document blurry — please re-upload a clear scan.' : undefined,
          uploadedAt: now - day * 35,
          reviewedAt: docStatus === 'pending' ? undefined : now - day * 30,
        })
      })
    }
  })

  await db.users.bulkAdd(users)
  await db.students.bulkAdd(students)
  await db.documents.bulkAdd(documents)

  // --- Jobs (marketplace) ---
  const jobs: Job[] = [
    { id: 'job_1', customerId: 'u_cust1', studentId: 'stu_1', categoryId: 'cat_clean', title: 'Deep clean 2BHK apartment', description: 'Full kitchen and 2 bathrooms deep cleaning.', address: '4th Block, Koramangala', neighbourhood: 'Koramangala', city: CITY, lat: 12.9352, lng: 77.6245, scheduledAt: now + day, durationHours: 3, estimatedPrice: 660, status: 'accepted', createdAt: now - day },
    { id: 'job_2', customerId: 'u_cust1', studentId: 'stu_2', categoryId: 'cat_electric', title: 'Install ceiling fan + fix switchboard', description: 'One fan installation and a faulty switchboard.', address: '100ft Road, Indiranagar', neighbourhood: 'Indiranagar', city: CITY, lat: 12.9719, lng: 77.6412, scheduledAt: now + day * 2, durationHours: 2, estimatedPrice: 520, status: 'assigned', createdAt: now - 3600000 },
    { id: 'job_3', customerId: 'u_cust2', studentId: 'stu_3', categoryId: 'cat_tutor', title: 'Class 8 Maths tuition', description: 'Twice-weekly maths tutoring.', address: 'Sector 2, HSR Layout', neighbourhood: 'HSR Layout', city: CITY, lat: 12.9116, lng: 77.6389, scheduledAt: now - day * 2, durationHours: 1.5, estimatedPrice: 450, status: 'completed', customerRating: 5, customerReview: 'Fatima is patient and thorough. Highly recommend!', createdAt: now - day * 5 },
    { id: 'job_4', customerId: 'u_cust2', categoryId: 'cat_plumb', title: 'Kitchen sink leak', description: 'Under-sink pipe is leaking.', address: 'Jayanagar 4th Block', neighbourhood: 'Jayanagar', city: CITY, lat: 12.9299, lng: 77.5826, scheduledAt: now + day * 3, durationHours: 1, estimatedPrice: 349, status: 'requested', createdAt: now - 7200000 },
  ]
  await db.jobs.bulkAdd(jobs)

  // --- Teacher applicants (ATS) ---
  const applicants: TeacherApplicant[] = [
    { id: 'app_1', name: 'Deepa Iyer', email: 'deepa@mail.com', phone: '9811111111', subject: 'Mathematics', qualifications: 'M.Sc Mathematics, B.Ed', experienceYears: 6, coverNote: 'Passionate about foundational maths for underserved students.', stage: 'interview', interviews: [{ id: 'iv_1', scheduledAt: now + day, mode: 'online', interviewer: 'Lighthouse Admin', result: 'pending' }], recruiterNotes: [{ id: 'n1', author: 'Admin', text: 'Strong screening call.', at: now - day }], rating: 4, appliedAt: now - day * 6, updatedAt: now - day },
    { id: 'app_2', name: 'Sanjay Gupta', email: 'sanjay@mail.com', phone: '9822222222', subject: 'Computer Science', qualifications: 'B.Tech CSE', experienceYears: 3, coverNote: 'Want to teach coding to academy students.', stage: 'screening', interviews: [], recruiterNotes: [], rating: 3, appliedAt: now - day * 3, updatedAt: now - day * 2 },
    { id: 'app_3', name: 'Meera Joshi', email: 'meera@mail.com', phone: '9833333333', subject: 'English', qualifications: 'MA English, TEFL', experienceYears: 8, coverNote: 'Spoken English and communication trainer.', stage: 'offer', interviews: [{ id: 'iv_2', scheduledAt: now - day * 2, mode: 'in_person', interviewer: 'Admin', result: 'pass', notes: 'Excellent demo class.' }], recruiterNotes: [{ id: 'n2', author: 'Admin', text: 'Offer at 45k/month.', at: now - day }], rating: 5, appliedAt: now - day * 10, updatedAt: now - day },
    { id: 'app_4', name: 'Karthik Rao', email: 'karthik@mail.com', phone: '9844444444', subject: 'Vocational — Electrical', qualifications: 'Diploma EEE, 10y field', experienceYears: 10, coverNote: 'Hands-on electrical trainer.', stage: 'applied', interviews: [], recruiterNotes: [], rating: 0, appliedAt: now - 3600000 * 5, updatedAt: now - 3600000 * 5 },
    { id: 'app_5', name: 'Nisha Verma', email: 'nisha@mail.com', phone: '9855555555', subject: 'Beauty & Wellness', qualifications: 'Certified beautician, 7y', experienceYears: 7, coverNote: 'Vocational beauty trainer.', stage: 'rejected', interviews: [{ id: 'iv_3', scheduledAt: now - day * 4, mode: 'online', interviewer: 'Admin', result: 'fail', notes: 'Not enough teaching aptitude.' }], recruiterNotes: [], rating: 2, appliedAt: now - day * 12, updatedAt: now - day * 4 },
  ]
  await db.applicants.bulkAdd(applicants)

  // --- Employees (HRMS) ---
  const employees: Employee[] = [
    { id: 'emp_1', userId: 'u_admin', name: 'Lighthouse Admin', email: 'admin@lighthouse.org', phone: '9000000001', designation: 'Program Director', department: 'Administration', employmentType: 'full_time', status: 'active', joinDate: '2021-01-15', monthlySalary: 90000, createdAt: now },
    { id: 'emp_2', name: 'Meena Bhat', email: 'meena@lighthouse.org', phone: '9700000002', designation: 'HR Manager', department: 'Human Resources', employmentType: 'full_time', status: 'active', joinDate: '2022-03-01', monthlySalary: 65000, managerId: 'emp_1', createdAt: now },
    { id: 'emp_3', name: 'Fatima Khan', email: 'fatima@lighthouse.org', phone: '9700000003', designation: 'Maths Instructor', department: 'Academy', employmentType: 'full_time', status: 'active', joinDate: '2023-07-10', monthlySalary: 48000, managerId: 'emp_1', createdAt: now },
    { id: 'emp_4', name: 'George Thomas', email: 'george@lighthouse.org', phone: '9700000004', designation: 'Placement Officer', department: 'Placements', employmentType: 'full_time', status: 'active', joinDate: '2022-11-20', monthlySalary: 52000, managerId: 'emp_1', createdAt: now },
    { id: 'emp_5', name: 'Sara Pinto', email: 'sara@lighthouse.org', phone: '9700000005', designation: 'English Trainer', department: 'Academy', employmentType: 'part_time', status: 'on_leave', joinDate: '2023-02-05', monthlySalary: 30000, managerId: 'emp_2', createdAt: now },
    { id: 'emp_6', name: 'Imran Sheikh', email: 'imran@lighthouse.org', phone: '9700000006', designation: 'Vocational Trainer', department: 'Academy', employmentType: 'contract', status: 'active', joinDate: '2024-01-08', monthlySalary: 40000, managerId: 'emp_2', createdAt: now },
  ]
  await db.employees.bulkAdd(employees)

  // --- Attendance (today) ---
  const today = new Date(now).toISOString().slice(0, 10)
  const attendance: Attendance[] = employees.map((e, i) => ({
    id: `att_${e.id}_${today}`,
    employeeId: e.id,
    date: today,
    checkIn: e.status === 'on_leave' ? undefined : `09:${(10 + i * 3) % 60}`.padEnd(5, '0'),
    checkOut: undefined,
    status: e.status === 'on_leave' ? 'leave' : i === 5 ? 'wfh' : 'present',
  }))
  await db.attendance.bulkAdd(attendance)

  // --- Leaves ---
  const leaves: LeaveRequest[] = [
    { id: 'lv_1', employeeId: 'emp_5', type: 'sick', from: today, to: today, reason: 'Fever', status: 'approved', approverId: 'emp_2', createdAt: now - day },
    { id: 'lv_2', employeeId: 'emp_3', type: 'casual', from: '2026-07-25', to: '2026-07-26', reason: 'Family function', status: 'pending', createdAt: now - 3600000 * 4 },
  ]
  await db.leaves.bulkAdd(leaves)

  // --- Payroll (last month) ---
  const payroll: PayrollRecord[] = employees.map((e) => ({
    id: `pay_${e.id}_2026-06`,
    employeeId: e.id,
    month: '2026-06',
    base: e.monthlySalary,
    allowances: Math.round(e.monthlySalary * 0.1),
    deductions: Math.round(e.monthlySalary * 0.08),
    net: Math.round(e.monthlySalary * 1.02),
    status: 'paid',
  }))
  await db.payroll.bulkAdd(payroll)

  // --- A couple of notifications for the demo customer ---
  await notify('u_cust1', 'Booking confirmed', 'Priya Sharma accepted your cleaning job.', 'success', '/customer/bookings')
  await notify('u_admin', '2 documents awaiting review', 'Sneha Patil and Mohammed Ali submitted documents.', 'action', '/admin/verification')
}
