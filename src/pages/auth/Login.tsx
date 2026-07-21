import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, GraduationCap, Users, ShieldCheck, RotateCcw, ArrowLeft } from 'lucide-react'
import { useAuth, HOME_BY_ROLE } from '@/lib/auth'
import { seedDatabase } from '@/lib/seed'
import { generateOtp } from '@/lib/utils'
import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/form'
import { OtpVerify } from '@/components/work/OtpVerify'
import { toast } from '@/components/ui/toast'
import type { User } from '@/lib/types'

const DEMO = [
  { id: 'u_cust1', label: 'Customer', icon: Compass, desc: 'Anita — books services' },
  { id: 'u_stu_1', label: 'Student', icon: GraduationCap, desc: 'Priya — verified pro' },
  { id: 'u_admin', label: 'Admin / HR', icon: ShieldCheck, desc: 'Full back-office' },
]

export function Login() {
  const { login, verifyCredentials, loginAs } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  // Admin 2FA: hold the verified user + generated code until the second factor passes.
  const [twoFA, setTwoFA] = useState<{ user: User; code: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const u = await verifyCredentials(email, password)
      if (u.role === 'admin') {
        setTwoFA({ user: u, code: generateOtp() })
        return
      }
      await login(email, password)
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`)
      navigate(HOME_BY_ROLE[u.role])
    } catch (err) {
      toast.error('Login failed', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const complete2FA = async () => {
    if (!twoFA) return
    const u = await loginAs(twoFA.user.id)
    toast.success(`Welcome back, ${u.name.split(' ')[0]}!`)
    navigate(HOME_BY_ROLE[u.role])
  }

  const quick = async (id: string) => {
    const u = await loginAs(id)
    toast.success(`Signed in as ${u.name}`)
    navigate(HOME_BY_ROLE[u.role])
  }

  const [resetting, setResetting] = useState(false)
  const resetDemo = async () => {
    setResetting(true)
    localStorage.removeItem('lighthouse.session')
    await seedDatabase(true)
    toast.success('Demo data reset', 'Fresh sample data has been loaded.')
    setResetting(false)
  }

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-12 text-white lg:flex">
        <Link to="/">
          <Logo className="[&_span]:text-white [&_.text-beacon-600]:text-beacon-300" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Work that lifts communities.</h2>
          <p className="mt-3 max-w-sm text-brand-100">
            Sign in to book verified pros, find local work, or manage the academy.
          </p>
        </div>
        <p className="text-xs text-brand-200">© 2026 Lighthouse Academy Works</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <Link to="/"><Logo /></Link>
          </div>
          {twoFA ? (
            <div>
              <button onClick={() => setTwoFA(null)} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Two-factor verification</h1>
              </div>
              <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
                Admin accounts require a second factor. We sent a 6-digit code to <span className="font-medium">{twoFA.user.email}</span>.
              </p>
              <OtpVerify expected={twoFA.code} onVerified={complete2FA} />
            </div>
          ) : (
          <>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Log in</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Welcome back to Lighthouse.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </Field>
            <Field label="Password" required>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>
            <Button type="submit" className="w-full" loading={loading}>Log in</Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            New here?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link>
          </p>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /> QUICK DEMO LOGIN <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEMO.map((d) => (
              <button
                key={d.id}
                onClick={() => quick(d.id)}
                title={d.desc}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center transition hover:border-brand-300 hover:bg-brand-50"
              >
                <d.icon className="h-5 w-5 text-brand-600" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{d.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
            <Link to="/register?role=teacher" className="inline-flex items-center gap-1 hover:text-brand-600">
              <Users className="h-3.5 w-3.5" /> Apply to teach
            </Link>
            <button onClick={resetDemo} disabled={resetting} className="inline-flex items-center gap-1 hover:text-brand-600 disabled:opacity-50">
              <RotateCcw className="h-3.5 w-3.5" /> {resetting ? 'Resetting…' : 'Reset demo data'}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  )
}
