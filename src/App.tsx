import { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { ToastViewport } from '@/components/ui/toast'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
// Public entry pages stay eager for fast first paint.
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/auth/Login'
import { Register } from '@/pages/auth/Register'
import { NotFound } from '@/pages/NotFound'

// Authenticated module pages are code-split so heavy deps (Leaflet, Recharts)
// load only when their route is visited.
const named = <M, K extends keyof M>(loader: () => Promise<M>, key: K) =>
  lazy(async () => ({ default: (await loader())[key] as React.ComponentType }))

const Explore = named(() => import('@/pages/customer/Explore'), 'Explore')
const Bookings = named(() => import('@/pages/customer/Bookings'), 'Bookings')
const CustomerProfile = named(() => import('@/pages/customer/Profile'), 'Profile')
const LiveTrack = named(() => import('@/pages/customer/LiveTrack'), 'LiveTrack')
const StudentDashboard = named(() => import('@/pages/student/Dashboard'), 'StudentDashboard')
const FindJobs = named(() => import('@/pages/student/FindJobs'), 'FindJobs')
const ActiveWork = named(() => import('@/pages/student/ActiveWork'), 'ActiveWork')
const Verification = named(() => import('@/pages/student/Verification'), 'Verification')
const Skills = named(() => import('@/pages/student/Skills'), 'Skills')
const Earnings = named(() => import('@/pages/student/Earnings'), 'Earnings')
const StudentProfile = named(() => import('@/pages/student/Profile'), 'StudentProfile')
const AdminOverview = named(() => import('@/pages/admin/Overview'), 'AdminOverview')
const AdminVerification = named(() => import('@/pages/admin/Verification'), 'AdminVerification')
const AdminStudents = named(() => import('@/pages/admin/Students'), 'AdminStudents')
const AdminJobs = named(() => import('@/pages/admin/Jobs'), 'AdminJobs')
const AdminHiring = named(() => import('@/pages/admin/Hiring'), 'AdminHiring')
const AdminIncidents = named(() => import('@/pages/admin/Incidents'), 'AdminIncidents')
const AdminAudit = named(() => import('@/pages/admin/Audit'), 'AdminAudit')
const Openings = named(() => import('@/pages/teacher/Openings'), 'Openings')
const MyApplication = named(() => import('@/pages/teacher/MyApplication'), 'MyApplication')
const HrmsDashboard = named(() => import('@/pages/hrms/Dashboard'), 'HrmsDashboard')
const Employees = named(() => import('@/pages/hrms/Employees'), 'Employees')
const Attendance = named(() => import('@/pages/hrms/Attendance'), 'Attendance')
const Leaves = named(() => import('@/pages/hrms/Leaves'), 'Leaves')
const Payroll = named(() => import('@/pages/hrms/Payroll'), 'Payroll')

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer */}
            <Route path="/customer" element={<RequireAuth roles={['customer']}><AppShell /></RequireAuth>}>
              <Route index element={<Explore />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="track" element={<LiveTrack />} />
              <Route path="profile" element={<CustomerProfile />} />
            </Route>

            {/* Student */}
            <Route path="/student" element={<RequireAuth roles={['student']}><AppShell /></RequireAuth>}>
              <Route index element={<StudentDashboard />} />
              <Route path="jobs" element={<FindJobs />} />
              <Route path="active" element={<ActiveWork />} />
              <Route path="verification" element={<Verification />} />
              <Route path="skills" element={<Skills />} />
              <Route path="earnings" element={<Earnings />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            {/* Teacher */}
            <Route path="/teacher" element={<RequireAuth roles={['teacher']}><AppShell /></RequireAuth>}>
              <Route index element={<Openings />} />
              <Route path="application" element={<MyApplication />} />
            </Route>

            {/* Admin */}
            <Route path="/admin" element={<RequireAuth roles={['admin']}><AppShell /></RequireAuth>}>
              <Route index element={<AdminOverview />} />
              <Route path="verification" element={<AdminVerification />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="hiring" element={<AdminHiring />} />
              <Route path="incidents" element={<AdminIncidents />} />
              <Route path="audit" element={<AdminAudit />} />
            </Route>

            {/* HRMS */}
            <Route path="/hrms" element={<RequireAuth roles={['admin', 'employee']}><AppShell /></RequireAuth>}>
              <Route index element={<HrmsDashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="leaves" element={<Leaves />} />
              <Route path="payroll" element={<Payroll />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastViewport />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
