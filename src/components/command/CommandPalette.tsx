import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, CornerDownLeft, ArrowUp, ArrowDown, Command as CmdIcon, Moon, Sun, LogOut } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { NAV_BY_ROLE } from '@/components/layout/nav'
import { Icon } from '@/components/common/Icon'
import { cn } from '@/lib/utils'

interface CmdItem {
  id: string
  group: 'Navigation' | 'Actions' | 'Students' | 'Jobs' | 'Employees' | 'Applicants'
  title: string
  subtitle?: string
  icon: ReactNode
  keywords?: string
  run: () => void
}

export function CommandPalette() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Global hotkey: Cmd/Ctrl-K toggles; Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    const openEvt = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('lighthouse:command', openEvt)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('lighthouse:command', openEvt)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [open])

  const role = user?.role
  // Role-scoped entity queries (only run for roles that can see them).
  const students = useLiveQuery(
    () => (open && (role === 'admin' || role === 'customer') ? db.students.toArray() : []),
    [open, role],
  )
  const jobs = useLiveQuery(async () => {
    if (!open || !user) return []
    if (role === 'admin') return db.jobs.toArray()
    if (role === 'customer') return db.jobs.where('customerId').equals(user.id).toArray()
    return []
  }, [open, role, user?.id])
  const employees = useLiveQuery(
    () => (open && (role === 'admin' || role === 'employee') ? db.employees.toArray() : []),
    [open, role],
  )
  const applicants = useLiveQuery(() => (open && role === 'admin' ? db.applicants.toArray() : []), [open, role])

  const items = useMemo<CmdItem[]>(() => {
    if (!user) return []
    const go = (to: string) => () => {
      navigate(to)
      setOpen(false)
    }
    const list: CmdItem[] = []

    // Navigation
    for (const it of NAV_BY_ROLE[user.role].items) {
      list.push({
        id: `nav:${it.to}`,
        group: 'Navigation',
        title: it.label,
        subtitle: 'Go to page',
        icon: <Icon name={it.icon} className="h-4 w-4" />,
        run: go(it.to),
      })
    }

    // Actions
    list.push({
      id: 'act:theme',
      group: 'Actions',
      title: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
      icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      keywords: 'theme dark light appearance',
      run: () => {
        toggle()
        setOpen(false)
      },
    })
    if (role === 'customer') list.push({ id: 'act:explore', group: 'Actions', title: 'Explore & book a pro', icon: <Search className="h-4 w-4" />, run: go('/customer') })
    if (role === 'student') list.push({ id: 'act:skills', group: 'Actions', title: 'Take a skill assessment', icon: <Icon name="Award" className="h-4 w-4" />, run: go('/student/skills') })
    if (role === 'admin') list.push({ id: 'act:verify', group: 'Actions', title: 'Open verification queue', icon: <Icon name="ShieldCheck" className="h-4 w-4" />, run: go('/admin/verification') })
    list.push({
      id: 'act:logout',
      group: 'Actions',
      title: 'Log out',
      icon: <LogOut className="h-4 w-4" />,
      keywords: 'sign out exit',
      run: () => {
        logout()
        navigate('/login')
        setOpen(false)
      },
    })

    // Entities
    for (const s of students ?? []) {
      list.push({
        id: `stu:${s.id}`,
        group: 'Students',
        title: s.name,
        subtitle: `${s.neighbourhood} · ${s.skills.slice(0, 2).join(', ')}`,
        icon: <Icon name="Users" className="h-4 w-4" />,
        keywords: s.skills.join(' '),
        run: go(role === 'admin' ? '/admin/students' : '/customer'),
      })
    }
    for (const j of jobs ?? []) {
      list.push({
        id: `job:${j.id}`,
        group: 'Jobs',
        title: j.title,
        subtitle: `${j.status.replace(/_/g, ' ')} · ${j.neighbourhood}`,
        icon: <Icon name="Briefcase" className="h-4 w-4" />,
        run: go(role === 'admin' ? '/admin/jobs' : '/customer/bookings'),
      })
    }
    for (const e of employees ?? []) {
      list.push({
        id: `emp:${e.id}`,
        group: 'Employees',
        title: e.name,
        subtitle: `${e.designation} · ${e.department}`,
        icon: <Icon name="Users" className="h-4 w-4" />,
        run: go('/hrms/employees'),
      })
    }
    for (const a of applicants ?? []) {
      list.push({
        id: `app:${a.id}`,
        group: 'Applicants',
        title: a.name,
        subtitle: `${a.subject} · ${a.stage}`,
        icon: <Icon name="UserPlus" className="h-4 w-4" />,
        run: go('/admin/hiring'),
      })
    }
    return list
  }, [user, role, theme, students, jobs, employees, applicants, navigate, toggle, logout])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    const scored = items
      .map((it) => {
        const hay = `${it.title} ${it.subtitle ?? ''} ${it.keywords ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return null
        const score = it.title.toLowerCase().startsWith(q) ? 0 : it.title.toLowerCase().includes(q) ? 1 : 2
        return { it, score }
      })
      .filter(Boolean) as { it: CmdItem; score: number }[]
    return scored.sort((a, b) => a.score - b.score).map((s) => s.it)
  }, [items, query])

  useEffect(() => {
    if (active >= filtered.length) setActive(0)
  }, [filtered.length, active])

  if (!user || !open) return null

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[active]?.run()
    }
  }

  // Render with lightweight grouping while keeping a flat active index.
  let flatIndex = -1
  const groups = filtered.reduce<Record<string, CmdItem[]>>((acc, it) => {
    ;(acc[it.group] ??= []).push(it)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative z-10 w-full max-w-xl animate-fade-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onListKey}
            placeholder="Search pages, people, jobs, or run an action…"
            className="h-14 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            aria-label="Command palette search"
          />
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline dark:border-slate-700">ESC</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">No results for “{query}”</p>
          ) : (
            Object.entries(groups).map(([group, groupItems]) => (
              <div key={group} className="mb-1">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{group}</p>
                {groupItems.map((it) => {
                  flatIndex++
                  const isActive = flatIndex === active
                  const idx = flatIndex
                  return (
                    <button
                      key={it.id}
                      onMouseMove={() => setActive(idx)}
                      onClick={() => it.run()}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm',
                        isActive ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-100' : 'text-slate-700 dark:text-slate-200',
                      )}
                    >
                      <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', isActive ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/25 dark:text-brand-100' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400')}>
                        {it.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{it.title}</span>
                        {it.subtitle && <span className="block truncate text-xs text-slate-400 dark:text-slate-500">{it.subtitle}</span>}
                      </span>
                      {isActive && <CornerDownLeft className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
          <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> navigate</span>
          <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> select</span>
          <span className="ml-auto flex items-center gap-1"><CmdIcon className="h-3 w-3" /> K to toggle</span>
        </div>
      </div>
    </div>
  )
}
