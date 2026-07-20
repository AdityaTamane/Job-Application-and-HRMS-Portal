import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, SlidersHorizontal, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { NEIGHBOURHOODS } from '@/lib/seed'
import type { Student } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input, Select } from '@/components/ui/form'
import { Icon } from '@/components/common/Icon'
import { EmptyState } from '@/components/ui/misc'
import { StudentCard } from '@/components/marketplace/StudentCard'
import { StudentProfileModal } from '@/components/marketplace/StudentProfileModal'
import { BookingModal } from '@/components/marketplace/BookingModal'
import { cn } from '@/lib/utils'

type SortKey = 'rating' | 'price_low' | 'price_high' | 'jobs'

export function Explore() {
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const students = useLiveQuery(() => db.students.toArray(), [])

  const [category, setCategory] = useState<string>('all')
  const [neighbourhood, setNeighbourhood] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const [sort, setSort] = useState<SortKey>('rating')

  const [viewing, setViewing] = useState<Student | null>(null)
  const [booking, setBooking] = useState<Student | null>(null)

  const filtered = useMemo(() => {
    let list = (students ?? []).filter((s) => s.verificationStatus !== 'rejected')
    if (verifiedOnly) list = list.filter((s) => s.verificationStatus === 'verified')
    if (category !== 'all') list = list.filter((s) => s.serviceCategoryIds.includes(category))
    if (neighbourhood !== 'all') list = list.filter((s) => s.neighbourhood === neighbourhood)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.skills.some((sk) => sk.toLowerCase().includes(q)),
      )
    }
    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating
      if (sort === 'price_low') return a.hourlyRate - b.hourlyRate
      if (sort === 'price_high') return b.hourlyRate - a.hourlyRate
      return b.jobsCompleted - a.jobsCompleted
    })
    return sorted
  }, [students, verifiedOnly, category, neighbourhood, query, sort])

  return (
    <div>
      <PageHeader
        title="Find a verified pro"
        subtitle="Book background-verified graduates from your neighbourhood"
      />

      {/* Category catalog */}
      <div className="mb-5 flex gap-3 overflow-x-auto pb-2">
        <CategoryTile active={category === 'all'} icon="LayoutGrid" label="All" onClick={() => setCategory('all')} />
        {categories?.map((c) => (
          <CategoryTile
            key={c.id}
            active={category === c.id}
            icon={c.icon}
            label={c.name}
            onClick={() => setCategory(c.id)}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-5 flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search by name or skill…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={neighbourhood} onChange={(e) => setNeighbourhood(e.target.value)} className="md:w-44">
          <option value="all">All neighbourhoods</option>
          {Object.keys(NEIGHBOURHOODS).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="md:w-40">
          <option value="rating">Top rated</option>
          <option value="jobs">Most jobs</option>
          <option value="price_low">Price: low to high</option>
          <option value="price_high">Price: high to low</option>
        </Select>
        <button
          onClick={() => setVerifiedOnly((v) => !v)}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition',
            verifiedOnly ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600',
          )}
        >
          <SlidersHorizontal className="h-4 w-4" /> Verified only
        </button>
      </div>

      <p className="mb-3 text-sm text-slate-500">{filtered.length} pro{filtered.length !== 1 && 's'} available</p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No pros match your filters"
          description="Try widening your search — different neighbourhood, category, or turn off ‘verified only’."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <StudentCard key={s.id} student={s} onView={setViewing} onBook={setBooking} />
          ))}
        </div>
      )}

      <StudentProfileModal
        student={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onBook={(s) => {
          setViewing(null)
          setBooking(s)
        }}
      />
      <BookingModal student={booking} open={!!booking} onClose={() => setBooking(null)} onBooked={() => {}} />
    </div>
  )
}

function CategoryTile({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex min-w-[92px] shrink-0 flex-col items-center gap-2 rounded-2xl border p-4 transition',
        active ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
      )}
    >
      <Icon name={icon} className="h-6 w-6" />
      <span className="text-center text-xs font-medium leading-tight">{label}</span>
    </button>
  )
}
