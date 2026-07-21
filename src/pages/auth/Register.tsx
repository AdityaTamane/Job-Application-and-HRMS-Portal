import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Compass, GraduationCap, Users } from 'lucide-react'
import { useAuth, HOME_BY_ROLE } from '@/lib/auth'
import { db } from '@/lib/db'
import { CITY, NEIGHBOURHOODS } from '@/lib/seed'
import { uid } from '@/lib/utils'
import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

type SignupRole = 'customer' | 'student' | 'teacher'

const ROLE_TABS: { id: SignupRole; label: string; icon: typeof Compass; desc: string }[] = [
  { id: 'customer', label: 'Customer', icon: Compass, desc: 'I want to hire local pros' },
  { id: 'student', label: 'Graduate', icon: GraduationCap, desc: 'I graduated & want work' },
  { id: 'teacher', label: 'Teacher', icon: Users, desc: 'I want to teach at the academy' },
]

export function Register() {
  const [params] = useSearchParams()
  const initial = (params.get('role') as SignupRole) || 'customer'
  const [role, setRole] = useState<SignupRole>(['customer', 'student', 'teacher'].includes(initial) ? initial : 'customer')
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    neighbourhood: 'Koramangala',
    subject: '',
    experienceYears: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (role === 'teacher') {
        // Teacher = ATS application + a login account to track status.
        const appId = uid('app')
        await db.applicants.add({
          id: appId,
          name: form.name,
          email: form.email.toLowerCase(),
          phone: form.phone,
          subject: form.subject || 'General',
          qualifications: '',
          experienceYears: Number(form.experienceYears) || 0,
          coverNote: '',
          stage: 'applied',
          interviews: [],
          recruiterNotes: [],
          rating: 0,
          appliedAt: Date.now(),
          updatedAt: Date.now(),
        })
        const user = await register({
          role: 'teacher',
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        })
        await db.users.update(user.id, { refId: appId })
        toast.success('Application submitted!', 'Track your status right here in your portal.')
        navigate(HOME_BY_ROLE.teacher)
        return
      }

      const appRole: Role = role
      const user = await register({
        role: appRole,
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })

      if (role === 'student') {
        const geo = NEIGHBOURHOODS[form.neighbourhood]
        const sid = uid('stu')
        await db.students.add({
          id: sid,
          userId: user.id,
          name: form.name,
          email: user.email,
          phone: form.phone,
          photoUrl: '',
          bio: '',
          academyBatch: 'Batch 2025-A',
          graduationDate: '2025-06-30',
          skills: [],
          serviceCategoryIds: [],
          neighbourhood: form.neighbourhood,
          city: CITY,
          lat: geo.lat,
          lng: geo.lng,
          serviceRadiusKm: 5,
          hourlyRate: 200,
          availability: 'offline',
          verificationStatus: 'unverified',
          badgeTier: 'none',
          rating: 0,
          ratingCount: 0,
          jobsCompleted: 0,
          createdAt: Date.now(),
        })
        await db.users.update(user.id, { refId: sid })
      }

      toast.success('Account created!', 'Welcome to Lighthouse.')
      navigate(HOME_BY_ROLE[appRole])
    } catch (err) {
      toast.error('Could not register', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/"><Logo /></Link>
        </div>
        <div className="card p-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose how you'd like to join Lighthouse.</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {ROLE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setRole(t.id)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition',
                  role === t.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300',
                )}
              >
                <t.icon className={cn('h-5 w-5', role === t.id ? 'text-brand-600' : 'text-slate-400 dark:text-slate-500')} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{t.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">{ROLE_TABS.find((t) => t.id === role)?.desc}</p>

          <form onSubmit={submit} className="mt-5 space-y-3.5">
            <Field label="Full name" required>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" required>
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@mail.com" required />
              </Field>
              <Field label="Phone" required>
                <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="98xxxxxxxx" required />
              </Field>
            </div>

            {role === 'student' && (
              <Field label="Neighbourhood" hint="Where you'll take up work">
                <Select value={form.neighbourhood} onChange={(e) => set('neighbourhood', e.target.value)}>
                  {Object.keys(NEIGHBOURHOODS).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              </Field>
            )}

            {role === 'teacher' && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Subject / skill" required>
                  <Input value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="e.g. Mathematics" required />
                </Field>
                <Field label="Experience (yrs)">
                  <Input type="number" min="0" value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} placeholder="0" />
                </Field>
              </div>
            )}

            <Field label="Password" required>
              <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Choose a password" required />
            </Field>

            <Button type="submit" className="w-full" loading={loading}>
              {role === 'teacher' ? 'Submit application' : 'Create account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
