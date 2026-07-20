import { Suspense, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { NAV_BY_ROLE } from './nav'
import { Icon } from '@/components/common/Icon'
import { Logo } from '@/components/common/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { PageLoader } from '@/components/ui/misc'
import { NotificationBell } from './NotificationBell'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  if (!user) return null
  const nav = NAV_BY_ROLE[user.role]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo />
        <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>
      <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{nav.title}</p>
      <nav className="flex-1 space-y-1 px-3">
        {nav.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
              )
            }
          >
            <Icon name={item.icon} className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar src={user.avatarUrl} name={user.name} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="truncate text-xs capitalize text-slate-400">{user.role}</p>
          </div>
          <button onClick={handleLogout} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-brand-950/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Avatar src={user.avatarUrl} name={user.name} size={34} className="lg:hidden" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
