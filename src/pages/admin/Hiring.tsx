import { useMemo, useState, type DragEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { UserPlus, GripVertical, Star } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { moveStage } from '@/lib/ats'
import type { ApplicationStage, TeacherApplicant } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/misc'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ApplicantModal } from '@/components/admin/ApplicantModal'
import { cn, timeAgo } from '@/lib/utils'

const COLUMNS: { stage: ApplicationStage; label: string; accent: string }[] = [
  { stage: 'applied', label: 'Applied', accent: 'border-t-slate-400' },
  { stage: 'screening', label: 'Screening', accent: 'border-t-brand-400' },
  { stage: 'interview', label: 'Interview', accent: 'border-t-purple-400' },
  { stage: 'offer', label: 'Offer', accent: 'border-t-beacon-400' },
  { stage: 'hired', label: 'Hired', accent: 'border-t-emerald-400' },
  { stage: 'rejected', label: 'Rejected', accent: 'border-t-red-300' },
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
      <PageHeader title="Teacher Hiring" subtitle="Drag applicants across the pipeline, or click to open" />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total applicants" value={total} tone="brand" icon={<UserPlus className="h-5 w-5" />} />
        <StatCard label="In pipeline" value={active} tone="purple" />
        <StatCard label="Hired" value={hired} tone="green" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = byStage.get(col.stage) ?? []
          return (
            <div
              key={col.stage}
              onDragOver={(e) => { e.preventDefault(); setOverStage(col.stage) }}
              onDragLeave={() => setOverStage((s) => (s === col.stage ? null : s))}
              onDrop={(e) => onDrop(e, col.stage)}
              className={cn(
                'flex w-72 shrink-0 flex-col rounded-2xl border-t-4 bg-slate-100/60 p-2 transition',
                col.accent,
                overStage === col.stage && 'bg-brand-50 ring-2 ring-brand-200',
              )}
            >
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{items.length}</span>
              </div>
              <div className="flex min-h-[120px] flex-col gap-2">
                {items.map((a) => (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', a.id); setDragId(a.id) }}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setSelected(a)}
                    className={cn(
                      'group cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md',
                      dragId === a.id && 'opacity-40',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400" />
                      <Avatar name={a.name} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{a.name}</p>
                        <p className="truncate text-xs text-slate-500">{a.subject}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge tone="gray">{a.experienceYears}y exp</Badge>
                      {a.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-medium text-beacon-600">
                          <Star className="h-3 w-3 fill-beacon-400 text-beacon-400" /> {a.rating}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-400">Updated {timeAgo(a.updatedAt)}</p>
                  </div>
                ))}
                {items.length === 0 && <p className="px-2 py-4 text-center text-xs text-slate-400">Drop here</p>}
              </div>
            </div>
          )
        })}
      </div>

      <ApplicantModal applicant={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  )
}
