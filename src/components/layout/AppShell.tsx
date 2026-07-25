import { Suspense, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useTeacherStatus } from '@/hooks/useTeacherStatus'
import { NAV_BY_ROLE, TEACHER_NAV } from './nav'
import { Icon } from '@/components/common/Icon'
import { Logo } from '@/components/common/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { PageLoader } from '@/components/ui/misc'
import { NotificationBell } from './NotificationBell'
import { NotificationsWatcher } from './NotificationsWatcher'
import { AnnouncementBanner } from './AnnouncementBanner'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MessagesButton } from '@/components/chat/MessagesButton'
import { CommandPalette } from '@/components/command/CommandPalette'
import { Search } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// Map a nav section title to its translation key.
const NAV_TITLE_KEY: Record<string, string> = {
  'Book a Pro': 'navTitle.customer',
  'Student Portal': 'navTitle.student',
  'Teacher Careers': 'navTitle.teacherCandidate',
  'Lighthouse Faculty': 'navTitle.teacherHired',
  'Lighthouse Admin': 'navTitle.admin',
  'Lighthouse HRMS': 'navTitle.employee',
}

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const t = useT()
  const [mobileOpen, setMobileOpen] = useState(false)
  const teacher = useTeacherStatus()
  if (!user) return null
  const nav =
    user.role === 'teacher'
      ? teacher?.hired
        ? TEACHER_NAV.hired
        : TEACHER_NAV.candidate
      : NAV_BY_ROLE[user.role]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo />
        <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>
      <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t(NAV_TITLE_KEY[nav.title] ?? '', {}) || nav.title}</p>
      <nav className="flex-1 space-y-1 px-3" aria-label={nav.title}>
        {nav.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )
            }
          >
            <Icon name={item.icon} className="h-[18px] w-[18px]" />
            {t(`nav.${item.to}`, {}) === `nav.${item.to}` ? item.label : t(`nav.${item.to}`)}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar src={user.avatarUrl} name={user.name} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
            <p className="truncate text-xs capitalize text-slate-400 dark:text-slate-500">{user.role}</p>
          </div>
          <button onClick={handleLogout} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10" title={t('app.logout')} aria-label={t('app.logout')}>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="glass hidden w-64 shrink-0 border-y-0 border-l-0 border-r lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="glass absolute left-0 top-0 h-full w-64 shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-x-0 border-t-0 border-b px-4 lg:px-6">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={() => window.dispatchEvent(new Event('lighthouse:command'))}
            className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-400 transition hover:border-slate-300 hover:text-slate-600 lg:flex dark:border-slate-700 dark:hover:border-slate-600 dark:hover:text-slate-300"
            aria-label="Open command palette"
          >
            <Search className="h-4 w-4" />
            <span>{t('app.search')}</span>
            <kbd className="ml-6 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] dark:border-slate-700">⌘K</kbd>
          </button>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <MessagesButton />
            <NotificationBell />
            <Avatar src={user.avatarUrl} name={user.name} size={34} className="lg:hidden" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">
            <AnnouncementBanner />
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <CommandPalette />
      <NotificationsWatcher />
    </div>
  )
}
