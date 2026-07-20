import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ShieldCheck, FileSearch, Clock } from 'lucide-react'
import { db } from '@/lib/db'
import type { Student } from '@/lib/types'

type QueueTab = 'pending' | 'verified' | 'rejected' | 'all'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, EmptyState } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusPill } from '@/components/ui/Badge'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'
import { VerificationReviewModal } from '@/components/admin/VerificationReviewModal'

export function AdminVerification() {
  const students = useLiveQuery(() => db.students.toArray(), [])
  const docs = useLiveQuery(() => db.documents.toArray(), [])
  const [tab, setTab] = useState<QueueTab>('pending')
  const [review, setReview] = useState<Student | null>(null)

  const docCount = useMemo(() => {
    const m = new Map<string, number>()
    ;(docs ?? []).forEach((d) => m.set(d.ownerId, (m.get(d.ownerId) ?? 0) + 1))
    return m
  }, [docs])

  const groups = useMemo(() => {
    const all = students ?? []
    return {
      pending: all.filter((s) => s.verificationStatus === 'pending'),
      verified: all.filter((s) => s.verificationStatus === 'verified'),
      rejected: all.filter((s) => s.verificationStatus === 'rejected'),
      all,
    }
  }, [students])

  const list = groups[tab]

  return (
    <div>
      <PageHeader title="Document Verification" subtitle="Review student documents and issue verified badges" />

      <div className="mb-5">
        <Tabs
          active={tab}
          onChange={(t) => setTab(t as QueueTab)}
          tabs={[
            { id: 'pending', label: 'Pending', count: groups.pending.length },
            { id: 'verified', label: 'Verified', count: groups.verified.length },
            { id: 'rejected', label: 'Rejected', count: groups.rejected.length },
            { id: 'all', label: 'All', count: groups.all.length },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="h-7 w-7" />} title="Nothing here" description="No students in this category right now." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start gap-3">
                <Avatar src={s.photoUrl} name={s.name} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-slate-900">{s.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500">{s.academyBatch} · {s.neighbourhood}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusPill status={s.verificationStatus} />
                    {s.badgeTier !== 'none' && <VerifiedBadge tier={s.badgeTier} showLabel={false} size="sm" />}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1"><FileSearch className="h-3.5 w-3.5" /> {docCount.get(s.id) ?? 0} documents</span>
                {s.verificationStatus === 'pending' && <span className="flex items-center gap-1 text-beacon-600"><Clock className="h-3.5 w-3.5" /> awaiting review</span>}
              </div>
              <Button size="sm" className="mt-3 w-full" variant={s.verificationStatus === 'pending' ? 'primary' : 'outline'} onClick={() => setReview(s)}>
                {s.verificationStatus === 'pending' ? 'Review now' : 'View documents'}
              </Button>
            </div>
          ))}
        </div>
      )}

      <VerificationReviewModal student={review} open={!!review} onClose={() => setReview(null)} />
    </div>
  )
}
