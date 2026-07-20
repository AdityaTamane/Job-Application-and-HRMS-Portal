import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  MapPin,
  Camera,
  Mic,
  KeyRound,
  Compass,
  GraduationCap,
  Users,
  ArrowRight,
  Star,
  BadgeCheck,
} from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/Button'

const MODULES = [
  {
    to: '/login',
    icon: Compass,
    title: 'Hire a Pro',
    desc: 'Book verified academy graduates for cleaning, repairs, tutoring & more near you.',
    cta: 'Book a service',
    accent: 'bg-brand-600',
  },
  {
    to: '/register?role=student',
    icon: GraduationCap,
    title: 'Join as a Graduate',
    desc: 'Lighthouse Academy graduate? Register, get verified, and find work in your neighbourhood.',
    cta: 'Register now',
    accent: 'bg-beacon-500',
  },
  {
    to: '/register?role=teacher',
    icon: Users,
    title: 'Teach with us',
    desc: 'Apply to train the next batch of students. Full hiring process, transparent stages.',
    cta: 'Apply to teach',
    accent: 'bg-emerald-600',
  },
]

const TRUST = [
  { icon: Camera, label: 'Selfie check', desc: 'Live selfie before every job' },
  { icon: Mic, label: 'Mic consent', desc: 'Audio safety on active work' },
  { icon: KeyRound, label: 'OTP verified', desc: 'Customer confirms with a code' },
  { icon: MapPin, label: 'Live location', desc: 'Geofenced start & live tracking' },
]

export function Landing() {
  return (
    <div className="min-h-full bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-900 to-brand-800 text-white">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-beacon-200">
              <ShieldCheck className="h-3.5 w-3.5" /> An NGO initiative · Verified local talent
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight lg:text-6xl">
              Trusted help from your <span className="text-beacon-400">neighbourhood.</span>
            </h1>
            <p className="mt-5 text-lg text-brand-100">
              Lighthouse trains people from underserved communities and connects them to local work —
              every graduate background-verified, every job safety-tracked.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login">
                <Button size="lg" variant="secondary" icon={<Compass className="h-5 w-5" />}>
                  Hire a Pro
                </Button>
              </Link>
              <Link to="/register?role=student">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  I'm a graduate
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-brand-100">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-beacon-400 text-beacon-400" /> 4.8 avg rating</span>
              <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-beacon-300" /> 500+ verified pros</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold text-slate-900">One platform, four journeys</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">
          Whether you need help, want work, or want to teach — start here.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {MODULES.map((m) => (
            <Link
              key={m.title}
              to={m.to}
              className="group card p-6 transition hover:-translate-y-1 hover:shadow-lift"
            >
              <div className={`inline-flex rounded-2xl ${m.accent} p-3 text-white`}>
                <m.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{m.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{m.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2">
                {m.cta} <ArrowRight className="h-4 w-4 transition-all" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust / verification */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-beacon-600">Safety first</span>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Verification at every step</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-500">
              Documents checked by our admin team, and a live safety gate before any pro begins work.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t) => (
              <div key={t.label} className="card p-5 text-center">
                <div className="mx-auto inline-flex rounded-2xl bg-brand-50 p-3 text-brand-600">
                  <t.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-800">{t.label}</h3>
                <p className="mt-1 text-sm text-slate-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <Logo />
          <p className="text-sm text-slate-400">© 2026 Lighthouse Academy Works · A not-for-profit initiative</p>
          <Link to="/login" className="text-sm font-medium text-brand-600 hover:underline">
            Admin / Staff login
          </Link>
        </div>
      </footer>
    </div>
  )
}
