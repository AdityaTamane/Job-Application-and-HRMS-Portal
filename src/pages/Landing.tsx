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
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { useT } from '@/lib/i18n'

const MODULES = [
  { to: '/login', icon: Compass, key: 'hire', accent: 'bg-brand-gradient' },
  { to: '/register?role=student', icon: GraduationCap, key: 'student', accent: 'bg-beacon-gradient' },
  {
    to: '/register?role=teacher',
    icon: Users,
    key: 'teacher',
    accent: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  },
]

const TRUST = [
  { icon: Camera, key: 'liveness' },
  { icon: Mic, key: 'mic' },
  { icon: KeyRound, key: 'otp' },
  { icon: MapPin, key: 'location' },
]

export function Landing() {
  const t = useT()
  return (
    <div className="min-h-full">
      {/* Nav */}
      <header className="glass sticky top-0 z-30 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">{t('landing.login')}</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">{t('landing.getStarted')}</Button>
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
              <ShieldCheck className="h-3.5 w-3.5" /> {t('landing.hero.badge')}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight lg:text-6xl">
              {t('landing.hero.title')}{' '}
              <span className="bg-gradient-to-r from-beacon-300 to-beacon-500 bg-clip-text text-transparent">
                {t('landing.hero.titleHighlight')}
              </span>
            </h1>
            <p className="mt-5 text-lg text-brand-100">
              {t('landing.hero.subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login">
                <Button size="lg" variant="secondary" icon={<Compass className="h-5 w-5" />}>
                  {t('landing.hero.hire')}
                </Button>
              </Link>
              <Link to="/register?role=student">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20 dark:border-white/30 dark:bg-white/10 dark:text-white">
                  {t('landing.hero.graduate')}
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-brand-100">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-beacon-400 text-beacon-400" /> {t('landing.hero.rating')}</span>
              <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-beacon-300" /> {t('landing.hero.pros')}</span>
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
        <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-slate-100">{t('landing.modules.title')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500 dark:text-slate-400">
          {t('landing.modules.subtitle')}
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {MODULES.map((m) => (
            <Link
              key={m.key}
              to={m.to}
              className="group card p-6 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lift"
            >
              <div className={`inline-flex rounded-2xl ${m.accent} p-3 text-white shadow-glow`}>
                <m.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">{t(`landing.module.${m.key}.title`)}</h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{t(`landing.module.${m.key}.desc`)}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-all group-hover:gap-2 dark:text-brand-300">
                {t(`landing.module.${m.key}.cta`)} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust / verification */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-beacon-600 dark:text-beacon-400">{t('landing.trust.eyebrow')}</span>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{t('landing.trust.title')}</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-500 dark:text-slate-400">
              {t('landing.trust.subtitle')}
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((item) => (
              <div key={item.key} className="card p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
                <div className="mx-auto inline-flex rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-800 dark:text-slate-100">{t(`landing.trust.${item.key}.label`)}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(`landing.trust.${item.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/70 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <Logo />
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('landing.footer.copyright')}</p>
          <Link to="/login" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
            {t('landing.footer.adminLogin')}
          </Link>
        </div>
      </footer>
    </div>
  )
}
