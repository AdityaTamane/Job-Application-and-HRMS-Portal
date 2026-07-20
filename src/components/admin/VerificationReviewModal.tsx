import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, X, FileText, ShieldCheck, ShieldX, ExternalLink } from 'lucide-react'
import type { BadgeTier, DocumentRecord, Student } from '@/lib/types'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { approveDocument, rejectDocument, verifyStudent, rejectStudentVerification } from '@/lib/admin'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Textarea } from '@/components/ui/form'
import { StatusPill } from '@/components/ui/Badge'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const TIERS: { tier: BadgeTier; label: string }[] = [
  { tier: 'basic', label: 'Basic' },
  { tier: 'verified', label: 'Verified' },
  { tier: 'premium', label: 'Premium' },
]

export function VerificationReviewModal({ student, open, onClose }: { student: Student | null; open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const docs = useLiveQuery(
    async () => (student ? db.documents.where('ownerId').equals(student.id).toArray() : []),
    [student?.id],
  )
  const [tier, setTier] = useState<BadgeTier>('verified')
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  if (!student || !user) return null
  const admin = { id: user.id, name: user.name }
  const required = (docs ?? []).filter((d) => d.type !== 'address_proof')
  const allApproved = required.length >= 3 && required.every((d) => d.status === 'approved')

  const doVerify = async () => {
    setBusy(true)
    try {
      await verifyStudent(student, tier, admin)
      toast.success(`${student.name.split(' ')[0]} verified`, `Issued the ${tier} badge.`)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const doReject = async () => {
    setBusy(true)
    try {
      await rejectStudentVerification(student, reason, admin)
      toast.info('Verification rejected', 'The student has been notified to resubmit.')
      setRejecting(false)
      setReason('')
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Review verification" size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar src={student.photoUrl} name={student.name} size={52} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
              <StatusPill status={student.verificationStatus} />
            </div>
            <p className="text-sm text-slate-500">{student.academyBatch} · {student.neighbourhood}</p>
          </div>
          {student.badgeTier !== 'none' && <VerifiedBadge tier={student.badgeTier} />}
        </div>

        <div className="space-y-3">
          {(docs ?? []).length === 0 && (
            <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">No documents uploaded yet.</p>
          )}
          {docs?.map((doc) => (
            <DocRow key={doc.id} doc={doc} admin={admin} />
          ))}
        </div>

        {/* Decision */}
        <div className="border-t border-slate-100 pt-4">
          {!rejecting ? (
            <>
              <p className="mb-2 text-sm font-medium text-slate-700">Issue badge tier</p>
              <div className="mb-4 flex gap-2">
                {TIERS.map((t) => (
                  <button
                    key={t.tier}
                    onClick={() => setTier(t.tier)}
                    className={cn(
                      'flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition',
                      tier === t.tier ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {!allApproved && (
                <p className="mb-3 text-xs text-beacon-600">Approve all required documents (Aadhaar, Marksheet, Photo) to enable verification.</p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-red-600" icon={<ShieldX className="h-4 w-4" />} onClick={() => setRejecting(true)}>
                  Reject
                </Button>
                <Button className="flex-1" variant="success" icon={<ShieldCheck className="h-4 w-4" />} disabled={!allApproved} loading={busy} onClick={doVerify}>
                  Approve & verify
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection (shared with the student)…" />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setRejecting(false)}>Back</Button>
                <Button variant="danger" className="flex-1" loading={busy} onClick={doReject}>Confirm rejection</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function DocRow({ doc, admin }: { doc: DocumentRecord; admin: { id: string; name: string } }) {
  const [showReject, setShowReject] = useState(false)
  const [note, setNote] = useState('')
  const isImage = doc.dataUrl.startsWith('data:image')

  return (
    <div className={cn('rounded-xl border p-3', doc.status === 'approved' ? 'border-emerald-200 bg-emerald-50/40' : doc.status === 'rejected' ? 'border-red-200 bg-red-50/40' : 'border-slate-200')}>
      <div className="flex items-center gap-3">
        <a href={doc.dataUrl} target="_blank" rel="noreferrer" className="group relative">
          {isImage ? (
            <img src={doc.dataUrl} alt={doc.label} className="h-14 w-14 rounded-lg border border-slate-200 object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
          )}
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
            <ExternalLink className="h-4 w-4" />
          </span>
        </a>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{doc.label}</p>
          <p className="truncate text-xs text-slate-400">{doc.fileName}</p>
          <div className="mt-1"><StatusPill status={doc.status} /></div>
        </div>
        {doc.status !== 'approved' && (
          <Button size="sm" variant="success" icon={<Check className="h-3.5 w-3.5" />} onClick={() => approveDocument(doc, admin)}>Approve</Button>
        )}
        {doc.status !== 'rejected' && (
          <Button size="sm" variant="outline" className="text-red-600" icon={<X className="h-3.5 w-3.5" />} onClick={() => setShowReject((s) => !s)}>Reject</Button>
        )}
      </div>
      {doc.reviewNote && <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">{doc.reviewNote}</p>}
      {showReject && (
        <div className="mt-2 flex gap-2">
          <input
            className="input h-9 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason (e.g. blurry scan)…"
          />
          <Button size="sm" variant="danger" onClick={async () => { await rejectDocument(doc, note || 'Please re-upload a clearer copy.', admin); setShowReject(false); setNote('') }}>
            Save
          </Button>
        </div>
      )}
    </div>
  )
}
