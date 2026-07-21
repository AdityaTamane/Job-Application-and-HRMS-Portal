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
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

const MODULES = [
  {
    to: '/login',
    icon: Compass,
    title: 'Hire a Pro',
    desc: 'Book verified academy graduates for cleaning, repairs, tutoring & more near you.',
    cta: 'Book a service',
    accent: 'bg-brand-gradient',
  },
  {
    to: '/register?role=student',
    icon: GraduationCap,
    title: 'Join as a Graduate',
    desc: 'Lighthouse Academy graduate? Register, get verified, and find work in your neighbourhood.',
    cta: 'Register now',
    accent: 'bg-beacon-gradient',
  },
  {
    to: '/register?role=teacher',
    icon: Users,
    title: 'Teach with us',
    desc: 'Apply to train the next batch of students. Full hiring process, transparent stages.',
    cta: 'Apply to teach',
    accent: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  },
]

const TRUST = [
  { icon: Camera, label: 'AI liveness', desc: 'On-device face check before every job' },
  { icon: Mic, label: 'Mic consent', desc: 'Audio safety on active work' },
  { icon: KeyRound, label: 'OTP verified', desc: 'Customer confirms with a code' },
  { icon: MapPin, label: 'Live location', desc: 'Geofenced start & live tracking' },
]

export function Landing() {
  return (
    <div className="min-h-full">
      {/* Nav */}
      <header className="glass sticky top-0 z-30 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-beacon-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div className="max-w-2xl animate-fade-in">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-beacon-200 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> An NGO initiative · Verified local talent
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight lg:text-6xl">
              Trusted help from your{' '}
              <span className="bg-gradient-to-r from-beacon-300 to-beacon-500 bg-clip-text text-transparent">
                neighbourhood.
              </span>
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
                <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20 dark:border-white/30 dark:bg-white/10 dark:text-white">
                  I'm a graduate
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-brand-100">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-beacon-400 text-beacon-400" /> 4.8 avg rating</span>
              <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-beacon-300" /> 500+ verified pros</span>
            </div>
          </div>

          {/* Floating glass preview */}
          <div className="relative hidden lg:block">
            <div className="animate-float rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-beacon-200">
                  <Sparkles className="h-3.5 w-3.5" /> AI Smart-Match
                </span>
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-bold text-emerald-200">98% match</span>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-gradient font-bold">PS</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Priya S. · Home Cleaning</p>
                  <p className="text-xs text-brand-100">Koramangala · ⭐ 4.9 · Premium verified</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-brand-100">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Certified in this skill</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> 1.2 km away · Available now</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> On-device liveness passed</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-slate-100">One platform, four journeys</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500 dark:text-slate-400">
          Whether you need help, want work, or want to teach — start here.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {MODULES.map((m) => (
            <Link
              key={m.title}
              to={m.to}
              className="group card p-6 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lift"
            >
              <div className={`inline-flex rounded-2xl ${m.accent} p-3 text-white shadow-glow`}>
                <m.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">{m.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{m.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-all group-hover:gap-2 dark:text-brand-300">
                {m.cta} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust / verification */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-beacon-600 dark:text-beacon-400">Safety first</span>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Verification at every step</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-500 dark:text-slate-400">
              Documents checked by our admin team, and an AI safety gate before any pro begins work.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t) => (
              <div key={t.label} className="card p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
                <div className="mx-auto inline-flex rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <t.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-800 dark:text-slate-100">{t.label}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/70 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <Logo />
          <p className="text-sm text-slate-400 dark:text-slate-500">© 2026 Lighthouse Academy Works · A not-for-profit initiative</p>
          <Link to="/login" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
            Admin / Staff login
          </Link>
        </div>
      </footer>
    </div>
  )
}
