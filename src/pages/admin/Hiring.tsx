import { useMemo, useState, type DragEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { UserPlus, GripVertical, Star, Users, CheckCircle2, Clock } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { moveStage } from '@/lib/ats'
import type { ApplicationStage, TeacherApplicant } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/misc'
import { Avatar } from '@/components/ui/Avatar'
import { ApplicantModal } from '@/components/admin/ApplicantModal'
import { cn, timeAgo } from '@/lib/utils'

interface Column {
  stage: ApplicationStage
  label: string
  color: string // hex accent
}

const COLUMNS: Column[] = [
  { stage: 'applied', label: 'Applied', color: '#64748b' },
  { stage: 'screening', label: 'Screening', color: '#4f83c8' },
  { stage: 'interview', label: 'Interview', color: '#a855f7' },
  { stage: 'offer', label: 'Offer', color: '#f7a825' },
  { stage: 'hired', label: 'Hired', color: '#10b981' },
  { stage: 'rejected', label: 'Rejected', color: '#ef4444' },
]

export function AdminHiring() {
  const { user } = useAuth()
  const applicants = useLiveQuery(() => db.applicants.toArray(), [])
  const [selected, setSelected] = useState<TeacherApplicant | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<ApplicationStage | null>(null)

  const byStage = useMemo(() => {
    const map = new Map<ApplicationStage, TeacherApplicant[]>()
    COLUMNS.forEach((c) => map.set(c.stage, []))
    ;(applicants ?? []).forEach((a) => map.get(a.stage)?.push(a))
    return map
  }, [applicants])

  const admin = user ? { id: user.id, name: user.name } : { id: '', name: '' }

  const onDrop = async (e: DragEvent, stage: ApplicationStage) => {
    e.preventDefault()
    setOverStage(null)
    const id = e.dataTransfer.getData('text/plain') || dragId
    setDragId(null)
    const applicant = (applicants ?? []).find((a) => a.id === id)
    if (!applicant || applicant.stage === stage) return
    if (stage === 'hired') {
      setSelected(applicant) // hire needs the employee form
      return
    }
    await moveStage(applicant, stage, admin)
  }

  const total = applicants?.length ?? 0
  const hired = byStage.get('hired')?.length ?? 0
  const active = total - hired - (byStage.get('rejected')?.length ?? 0)

  return (
    <div>
      <PageHeader title="Teacher Hiring" subtitle="Drag applicants across the pipeline, or click a card to open" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total applicants" value={total} tone="brand" icon={<UserPlus className="h-5 w-5" />} />
        <StatCard label="In pipeline" value={active} tone="purple" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Hired" value={hired} tone="green" icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = byStage.get(col.stage) ?? []
          const isOver = overStage === col.stage
          return (
            <div
              key={col.stage}
              onDragOver={(e) => {
                e.preventDefault()
                setOverStage(col.stage)
              }}
              onDragLeave={() => setOverStage((s) => (s === col.stage ? null : s))}
              onDrop={(e) => onDrop(e, col.stage)}
              className={cn(
                'flex w-72 shrink-0 flex-col rounded-2xl border bg-slate-50/80 transition dark:bg-slate-900/40',
                isOver
                  ? 'border-brand-300 bg-brand-50/70 ring-2 ring-brand-200 dark:border-brand-500/50 dark:bg-brand-500/5 dark:ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-800',
              )}
            >
              {/* Column header with a stage accent strip */}
              <div className="px-3 pt-3">
                <div className="mb-2.5 h-1 rounded-full" style={{ backgroundColor: col.color }} />
                <div className="flex items-center justify-between px-0.5 pb-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                    {col.label}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                    {items.length}
                  </span>
                </div>
              </div>

              <div className="flex min-h-[140px] flex-1 flex-col gap-2 px-2 pb-3">
                {items.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', a.id)
                      setDragId(a.id)
                    }}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setSelected(a)}
                    style={{ borderLeftColor: col.color }}
                    className={cn(
                      'group cursor-grab rounded-xl border border-l-[3px] border-slate-200 bg-white p-3 text-left shadow-sm transition',
                      'hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift active:cursor-grabbing',
                      'dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/50',
                      dragId === a.id && 'opacity-40',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-400 dark:text-slate-600" />
                      <Avatar name={a.name} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{a.name}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{a.subject}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: `${col.color}1a`, color: col.color }}
                      >
                        {a.experienceYears}y experience
                      </span>
                      {a.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-semibold text-beacon-600 dark:text-beacon-400">
                          <Star className="h-3.5 w-3.5 fill-beacon-400 text-beacon-400" /> {a.rating}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                      <Clock className="h-3 w-3" /> Updated {timeAgo(a.updatedAt)}
                    </p>
                  </button>
                ))}
                {items.length === 0 && (
                  <div
                    className={cn(
                      'flex flex-1 items-center justify-center rounded-xl border-2 border-dashed py-6 text-center text-xs transition',
                      isOver
                        ? 'border-brand-300 text-brand-500 dark:border-brand-500/50'
                        : 'border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500',
                    )}
                  >
                    Drop applicant here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ApplicantModal applicant={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  )
}
