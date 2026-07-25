import type { Role } from '@/lib/types'

export interface NavItem {
  to: string
  label: string
  icon: string // lucide icon name
  end?: boolean
}

// Navigation per role. Icon names map to lucide-react exports.
export const NAV_BY_ROLE: Record<Role, { title: string; items: NavItem[] }> = {
  customer: {
    title: 'Book a Pro',
    items: [
      { to: '/customer', label: 'Explore', icon: 'Compass', end: true },
      { to: '/customer/bookings', label: 'My Bookings', icon: 'CalendarCheck' },
      { to: '/customer/track', label: 'Live Track', icon: 'MapPin' },
      { to: '/customer/wallet', label: 'Wallet', icon: 'Wallet' },
      { to: '/customer/profile', label: 'Profile', icon: 'User' },
    ],
  },
  student: {
    title: 'Student Portal',
    items: [
      { to: '/student', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
      { to: '/student/jobs', label: 'Find Jobs', icon: 'Briefcase' },
      { to: '/student/active', label: 'Active Work', icon: 'Radar' },
      { to: '/student/verification', label: 'Verification', icon: 'ShieldCheck' },
      { to: '/student/skills', label: 'Skills & Certs', icon: 'Award' },
      { to: '/student/earnings', label: 'Earnings', icon: 'Wallet' },
      { to: '/student/wallet', label: 'Wallet', icon: 'Banknote' },
      { to: '/student/timeoff', label: 'Time Off', icon: 'CalendarOff' },
      { to: '/student/profile', label: 'Profile', icon: 'User' },
    ],
  },
  // Default (candidate) teacher nav — overridden dynamically once hired, see
  // TEACHER_NAV below and AppShell.
  teacher: {
    title: 'Teacher Careers',
    items: [
      { to: '/teacher', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
      { to: '/teacher/openings', label: 'Openings', icon: 'GraduationCap' },
      { to: '/teacher/application', label: 'My Application', icon: 'FileText' },
      { to: '/teacher/profile', label: 'Profile', icon: 'User' },
    ],
  },
  admin: {
    title: 'Lighthouse Admin',
    items: [
      { to: '/admin', label: 'Overview', icon: 'LayoutDashboard', end: true },
      { to: '/admin/verification', label: 'Verification', icon: 'ShieldCheck' },
      { to: '/admin/students', label: 'Students', icon: 'Users' },
      { to: '/admin/jobs', label: 'Marketplace', icon: 'Briefcase' },
      { to: '/admin/hiring', label: 'Teacher Hiring', icon: 'UserPlus' },
      { to: '/admin/incidents', label: 'Safety & Disputes', icon: 'Siren' },
      { to: '/admin/requests', label: 'Leave & Regularization', icon: 'Inbox' },
      { to: '/admin/announcements', label: 'Announcements', icon: 'Megaphone' },
      { to: '/admin/audit', label: 'Audit Log', icon: 'ScrollText' },
    ],
  },
  employee: {
    title: 'Lighthouse HRMS',
    items: [
      { to: '/hrms', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
      { to: '/hrms/employees', label: 'Employees', icon: 'Users' },
      { to: '/hrms/attendance', label: 'Attendance', icon: 'CalendarClock' },
      { to: '/hrms/leaves', label: 'Leaves', icon: 'CalendarOff' },
      { to: '/hrms/payroll', label: 'Payroll', icon: 'Banknote' },
    ],
  },
}

/**
 * The teacher portal morphs once the applicant is hired: candidates see a
 * careers/hiring experience; hired faculty see a staff experience (time off,
 * payslips) instead of openings.
 */
export const TEACHER_NAV: Record<'candidate' | 'hired', { title: string; items: NavItem[] }> = {
  candidate: NAV_BY_ROLE.teacher,
  hired: {
    title: 'Lighthouse Faculty',
    items: [
      { to: '/teacher', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
      { to: '/teacher/timeoff', label: 'Time Off', icon: 'CalendarOff' },
      { to: '/teacher/payslips', label: 'Payslips', icon: 'Banknote' },
      { to: '/teacher/application', label: 'Hiring History', icon: 'FileText' },
      { to: '/teacher/profile', label: 'Profile', icon: 'User' },
    ],
  },
}
