import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ShieldCheck, ShieldAlert, ShieldQuestion, Clock, Send } from 'lucide-react'
import { db } from '@/lib/db'
import { REQUIRED_DOCS, submitForVerification } from '@/lib/student'
import { useStudent } from '@/hooks/useStudent'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'
import { DocumentUploadCard } from '@/components/student/DocumentUploadCard'
import { toast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'
import type { VerificationStatus } from '@/lib/types'

const BANNER: Record<VerificationStatus, { icon: typeof ShieldCheck; cls: string; title: string; desc: string }> = {
  unverified: {
    icon: ShieldQuestion,
    cls: 'from-slate-100 to-slate-50 text-slate-700',
    title: 'Not verified yet',
    desc: 'Upload your documents below and submit for review to earn your verified badge.',
  },
  pending: {
    icon: Clock,
    cls: 'from-beacon-100 to-beacon-50 text-beacon-800',
    title: 'Under review',
    desc: 'Our admin team is reviewing your documents. This usually takes 1–2 days.',
  },
  verified: {
    icon: ShieldCheck,
    cls: 'from-emerald-100 to-emerald-50 text-emerald-800',
    title: "You're verified!",
    desc: 'Your verified badge is now visible to customers. Keep your documents up to date.',
  },
  rejected: {
    icon: ShieldAlert,
    cls: 'from-red-100 to-red-50 text-red-800',
    title: 'Needs attention',
    desc: 'Some documents were rejected. Please review the notes, re-upload, and submit again.',
  },
}

export function Verification() {
  const student = useStudent()
  const docs = useLiveQuery(
    async () => (student ? db.documents.where('ownerId').equals(student.id).toArray() : []),
    [student?.id],
  )
  const [submitting, setSubmitting] = useState(false)

  if (!student) return <PageLoader />
  const docByType = new Map((docs ?? []).map((d) => [d.type, d]))
  const requiredTypes = REQUIRED_DOCS.filter((d) => d.type !== 'address_proof').map((d) => d.type)
  const hasAllRequired = requiredTypes.every((t) => docByType.has(t))
  const banner = BANNER[student.verificationStatus]
  const canSubmit =
    hasAllRequired && (student.verificationStatus === 'unverified' || student.verificationStatus === 'rejected')

  const submit = async () => {
    setSubmitting(true)
    try {
      await submitForVerification(student)
      toast.success('Submitted for review!', 'We\'ll notify you once your documents are checked.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Verification" subtitle="Get background-verified to unlock more jobs and customer trust" />

      <div className={`mb-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-br p-5 sm:flex-row sm:items-center sm:justify-between ${banner.cls}`}>
        <div className="flex items-start gap-3">
          <banner.icon className="mt-0.5 h-8 w-8 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{banner.title}</h3>
              {student.verificationStatus === 'verified' && <VerifiedBadge tier={student.badgeTier} size="sm" />}
            </div>
            <p className="mt-0.5 text-sm opacity-90">{banner.desc}</p>
            {student.verifiedAt && (
              <p className="mt-1 text-xs opacity-70">Verified on {formatDate(student.verifiedAt)}</p>
            )}
          </div>
        </div>
        {canSubmit && (
          <Button variant="primary" icon={<Send className="h-4 w-4" />} loading={submitting} onClick={submit} className="shrink-0">
            Submit for review
          </Button>
        )}
      </div>

      {!hasAllRequired && student.verificationStatus !== 'verified' && (
        <p className="mb-4 text-sm text-slate-500">
          Upload all required documents (Aadhaar, Marksheet, Photo) to enable submission.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {REQUIRED_DOCS.map((d) => (
          <DocumentUploadCard
            key={d.type}
            student={student}
            type={d.type}
            label={d.label}
            hint={d.hint}
            optional={d.type === 'address_proof'}
            doc={docByType.get(d.type)}
          />
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        🔒 Your documents are used only for identity verification by the Lighthouse admin team and are never shared with
        customers. Only your verified badge is shown publicly.
      </div>
    </div>
  )
}
