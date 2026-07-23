import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Save, Mail, BadgeCheck } from 'lucide-react'
import { useApplicant } from '@/hooks/useApplicant'
import { updateApplicantProfile } from '@/lib/ats'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader, EmptyState } from '@/components/ui/misc'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusPill } from '@/components/ui/Badge'
import { Field, Input, Textarea } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'

export function TeacherProfile() {
  const applicant = useApplicant()
  const [form, setForm] = useState({ phone: '', subject: '', qualifications: '', experienceYears: '0', coverNote: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (applicant) {
      setForm({
        phone: applicant.phone,
        subject: applicant.subject,
        qualifications: applicant.qualifications,
        experienceYears: String(applicant.experienceYears),
        coverNote: applicant.coverNote,
      })
    }
  }, [applicant?.id])

  if (applicant === undefined) return <PageLoader />
  if (!applicant) {
    return (
      <div>
        <PageHeader title="My Profile" />
        <EmptyState title="No profile found" description="We couldn't find an application linked to your account." action={<Link to="/register?role=teacher"><Button>Apply now</Button></Link>} />
      </div>
    )
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateApplicantProfile(applicant, {
        phone: form.phone,
        subject: form.subject,
        qualifications: form.qualifications,
        experienceYears: Number(form.experienceYears) || 0,
        coverNote: form.coverNote,
      })
      toast.success('Profile updated')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Keep your teaching profile up to date" actions={<StatusPill status={applicant.stage} />} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <Avatar name={applicant.name} size={72} />
            <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">{applicant.name}</h3>
            <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"><Mail className="h-3.5 w-3.5" /> {applicant.email}</p>
            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <BadgeCheck className="h-3.5 w-3.5" /> {applicant.subject}
            </div>
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">Email is your login — contact the team to change it.</p>
          </CardBody>
        </Card>

        {/* Editable fields */}
        <Card className="lg:col-span-2">
          <CardHeader title="Teaching details" subtitle="Visible to the Lighthouse hiring team" />
          <CardBody>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
                <Field label="Primary subject"><Input value={form.subject} onChange={(e) => set('subject', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Qualifications"><Input value={form.qualifications} onChange={(e) => set('qualifications', e.target.value)} placeholder="e.g. M.Sc Mathematics, B.Ed" /></Field>
                <Field label="Years of experience"><Input type="number" min="0" value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} /></Field>
              </div>
              <Field label="About you"><Textarea value={form.coverNote} onChange={(e) => set('coverNote', e.target.value)} placeholder="A short note about your teaching approach…" /></Field>
              <div className="flex justify-end">
                <Button type="submit" icon={<Save className="h-4 w-4" />} loading={saving}>Save changes</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
