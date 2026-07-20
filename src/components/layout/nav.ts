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
      { to: '/student/earnings', label: 'Earnings', icon: 'Wallet' },
      { to: '/student/profile', label: 'Profile', icon: 'User' },
    ],
  },
  teacher: {
    title: 'Teacher Careers',
    items: [
      { to: '/teacher', label: 'Openings', icon: 'GraduationCap', end: true },
      { to: '/teacher/application', label: 'My Application', icon: 'FileText' },
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
