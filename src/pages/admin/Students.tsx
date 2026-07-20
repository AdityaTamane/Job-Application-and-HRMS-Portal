import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { setBadgeTier } from '@/lib/admin'
import type { BadgeTier, Student, VerificationStatus } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/misc'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusPill } from '@/components/ui/Badge'
import { Rating } from '@/components/common/Rating'
import { VerificationReviewModal } from '@/components/admin/VerificationReviewModal'

export function AdminStudents() {
  const { user } = useAuth()
  const students = useLiveQuery(() => db.students.toArray(), [])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<VerificationStatus | 'all'>('all')
  const [review, setReview] = useState<Student | null>(null)

  const filtered = useMemo(() => {
    let list = students ?? []
    if (status !== 'all') list = list.filter((s) => s.verificationStatus === status)
    if (q.trim()) {
      const query = q.toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(query) || s.neighbourhood.toLowerCase().includes(query))
    }
    return list
  }, [students, status, q])

  const admin = user ? { id: user.id, name: user.name } : { id: '', name: '' }

  return (
    <div>
      <PageHeader title="Students" subtitle={`${students?.length ?? 0} academy graduates on the platform`} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search by name or area…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as VerificationStatus | 'all')} className="sm:w-48">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-7 w-7" />} title="No students found" description="Try a different search or filter." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Jobs</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Badge</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={s.photoUrl} name={s.name} size={36} />
                        <div>
                          <p className="font-medium text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.academyBatch}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.neighbourhood}</td>
                    <td className="px-4 py-3"><Rating value={s.rating} count={s.ratingCount} size={12} /></td>
                    <td className="px-4 py-3 text-slate-600">{s.jobsCompleted}</td>
                    <td className="px-4 py-3"><StatusPill status={s.verificationStatus} /></td>
                    <td className="px-4 py-3">
                      {s.verificationStatus === 'verified' ? (
                        <Select
                          value={s.badgeTier}
                          onChange={(e) => setBadgeTier(s, e.target.value as BadgeTier, admin)}
                          className="h-8 w-28 py-1 text-xs"
                        >
                          <option value="basic">Basic</option>
                          <option value="verified">Verified</option>
                          <option value="premium">Premium</option>
                        </Select>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setReview(s)}>Review</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <VerificationReviewModal student={review} open={!!review} onClose={() => setReview(null)} />
    </div>
  )
}
