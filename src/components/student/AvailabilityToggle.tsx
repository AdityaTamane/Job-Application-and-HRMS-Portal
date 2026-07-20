import type { Availability, Student } from '@/lib/types'
import { setAvailability } from '@/lib/student'
import { cn } from '@/lib/utils'

const OPTIONS: { value: Availability; label: string; dot: string }[] = [
  { value: 'available', label: 'Available', dot: 'bg-emerald-500' },
  { value: 'busy', label: 'Busy', dot: 'bg-beacon-500' },
  { value: 'offline', label: 'Offline', dot: 'bg-slate-400' },
]

export function AvailabilityToggle({ student }: { student: Student }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => setAvailability(student, o.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
            student.availability === o.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', o.dot)} /> {o.label}
        </button>
      ))}
    </div>
  )
}
