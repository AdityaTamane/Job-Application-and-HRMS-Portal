import { useState } from 'react'
import type { Job } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import { createIncident } from '@/lib/incidents'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea, Select } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'

export function ReportIssueModal({
  job,
  againstName,
  open,
  onClose,
}: {
  job: Job
  againstName?: string
  open: boolean
  onClose: () => void
}) {
  const { user } = useAuth()
  const [type, setType] = useState<'complaint' | 'dispute'>('complaint')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!user || !subject.trim() || !description.trim()) {
      toast.error('Please add a subject and description')
      return
    }
    setLoading(true)
    try {
      await createIncident({
        type,
        jobId: job.id,
        raisedById: user.id,
        raisedByName: user.name,
        raisedByRole: user.role,
        againstName,
        subject: subject.trim(),
        description: description.trim(),
        priority: type === 'dispute' ? 'high' : 'medium',
      })
      toast.success('Report submitted', 'Our team will review it and get back to you.')
      onClose()
      setSubject('')
      setDescription('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Report an issue" size="md">
      <div className="space-y-4">
        <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          Regarding <span className="font-medium text-slate-700 dark:text-slate-200">{job.title}</span>
          {againstName && <> with {againstName}</>}.
        </p>
        <Field label="Type" required>
          <Select value={type} onChange={(e) => setType(e.target.value as 'complaint' | 'dispute')}>
            <option value="complaint">Complaint (service quality, conduct)</option>
            <option value="dispute">Dispute (payment, damage)</option>
          </Select>
        </Field>
        <Field label="Subject" required>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary of the issue" />
        </Field>
        <Field label="Describe what happened" required>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Give us the details so we can help…" />
        </Field>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={loading} onClick={submit}>Submit report</Button>
        </div>
      </div>
    </Modal>
  )
}
