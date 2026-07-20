import { useState, type ReactNode } from 'react'
import {
  Mail, Phone, GraduationCap, Briefcase, CalendarPlus, MessageSquarePlus, UserCheck, XCircle, Video, MapPin, ChevronRight,
} from 'lucide-react'
import type { InterviewRound, TeacherApplicant } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import { STAGES, moveStage, addNote, setRating, scheduleInterview, setInterviewResult, rejectApplicant, hireApplicant } from '@/lib/ats'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusPill, Badge } from '@/components/ui/Badge'
import { Rating } from '@/components/common/Rating'
import { Field, Input, Select } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'
import { formatDateTime } from '@/lib/utils'

function toLocalInput(ts: number) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ApplicantModal({ applicant, open, onClose }: { applicant: TeacherApplicant | null; open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const [note, setNote] = useState('')
  const [hiring, setHiring] = useState(false)
  const [iv, setIv] = useState({ when: toLocalInput(Date.now() + 86400000), mode: 'online', interviewer: 'Lighthouse Admin' })
  const [hire, setHire] = useState({ designation: '', department: 'Academy', employmentType: 'full_time', monthlySalary: '45000', joinDate: new Date().toISOString().slice(0, 10) })

  if (!applicant || !user) return null
  const admin = { id: user.id, name: user.name }
  const stageIdx = STAGES.findIndex((s) => s.stage === applicant.stage)
  const nextStage = STAGES[stageIdx + 1]

  const doHire = async () => {
    await hireApplicant(
      applicant,
      {
        designation: hire.designation || `${applicant.subject} Instructor`,
        department: hire.department,
        employmentType: hire.employmentType as 'full_time' | 'part_time' | 'contract',
        monthlySalary: Number(hire.monthlySalary) || 40000,
        joinDate: hire.joinDate,
      },
      admin,
    )
    toast.success(`${applicant.name} hired!`, 'An employee record was created in HRMS.')
    setHiring(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Applicant" size="lg">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar name={applicant.name} size={64} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{applicant.name}</h2>
              <StatusPill status={applicant.stage} />
            </div>
            <p className="text-sm text-slate-500">{applicant.subject} · {applicant.experienceYears} yrs experience</p>
            <div className="mt-1.5"><Rating value={applicant.rating} interactive size={18} onChange={(r) => setRating(applicant, r)} /></div>
          </div>
        </div>

        {/* Contact + details */}
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow icon={<Mail className="h-4 w-4" />} label={applicant.email} />
          <InfoRow icon={<Phone className="h-4 w-4" />} label={applicant.phone} />
          <InfoRow icon={<GraduationCap className="h-4 w-4" />} label={applicant.qualifications || 'Not specified'} />
          <InfoRow icon={<Briefcase className="h-4 w-4" />} label={`${applicant.experienceYears} years`} />
        </div>
        {applicant.coverNote && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{applicant.coverNote}</p>}

        {/* Stage control */}
        {applicant.stage !== 'hired' && applicant.stage !== 'rejected' && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3">
            <span className="text-sm font-medium text-slate-600">Move to:</span>
            {nextStage && nextStage.stage !== 'hired' && (
              <Button size="sm" icon={<ChevronRight className="h-4 w-4" />} onClick={async () => { await moveStage(applicant, nextStage.stage, admin); toast.success(`Moved to ${nextStage.label}`) }}>
                {nextStage.label}
              </Button>
            )}
            <Button size="sm" variant="success" icon={<UserCheck className="h-4 w-4" />} onClick={() => setHiring(true)}>Hire</Button>
            <Button size="sm" variant="outline" className="text-red-600" icon={<XCircle className="h-4 w-4" />} onClick={async () => { await rejectApplicant(applicant, admin); toast.info('Applicant rejected') }}>
              Reject
            </Button>
          </div>
        )}

        {/* Hire form */}
        {hiring && (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <p className="text-sm font-semibold text-slate-700">Create employee record</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Designation"><Input value={hire.designation} onChange={(e) => setHire({ ...hire, designation: e.target.value })} placeholder={`${applicant.subject} Instructor`} /></Field>
              <Field label="Department">
                <Select value={hire.department} onChange={(e) => setHire({ ...hire, department: e.target.value })}>
                  {['Academy', 'Administration', 'Placements', 'Human Resources'].map((d) => <option key={d}>{d}</option>)}
                </Select>
              </Field>
              <Field label="Employment type">
                <Select value={hire.employmentType} onChange={(e) => setHire({ ...hire, employmentType: e.target.value })}>
                  <option value="full_time">Full time</option>
                  <option value="part_time">Part time</option>
                  <option value="contract">Contract</option>
                </Select>
              </Field>
              <Field label="Monthly salary (₹)"><Input type="number" value={hire.monthlySalary} onChange={(e) => setHire({ ...hire, monthlySalary: e.target.value })} /></Field>
              <Field label="Join date"><Input type="date" value={hire.joinDate} onChange={(e) => setHire({ ...hire, joinDate: e.target.value })} /></Field>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setHiring(false)}>Cancel</Button>
              <Button variant="success" className="flex-1" icon={<UserCheck className="h-4 w-4" />} onClick={doHire}>Confirm hire</Button>
            </div>
          </div>
        )}

        {/* Interviews */}
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><CalendarPlus className="h-4 w-4" /> Interviews</h3>
          <div className="space-y-2">
            {applicant.interviews.map((round) => (
              <InterviewRow key={round.id} applicant={applicant} round={round} />
            ))}
            {applicant.interviews.length === 0 && <p className="text-sm text-slate-400">No interviews scheduled yet.</p>}
          </div>
          <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-4">
            <Input type="datetime-local" value={iv.when} onChange={(e) => setIv({ ...iv, when: e.target.value })} className="sm:col-span-2" />
            <Select value={iv.mode} onChange={(e) => setIv({ ...iv, mode: e.target.value })}>
              <option value="online">Online</option>
              <option value="in_person">In person</option>
            </Select>
            <Button size="md" icon={<CalendarPlus className="h-4 w-4" />} onClick={async () => { await scheduleInterview(applicant, { scheduledAt: new Date(iv.when).getTime(), mode: iv.mode as InterviewRound['mode'], interviewer: iv.interviewer }, admin); toast.success('Interview scheduled') }}>
              Schedule
            </Button>
          </div>
        </section>

        {/* Notes */}
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><MessageSquarePlus className="h-4 w-4" /> Recruiter notes</h3>
          <div className="space-y-2">
            {applicant.recruiterNotes.map((n) => (
              <div key={n.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="text-slate-700">{n.text}</p>
                <p className="mt-1 text-xs text-slate-400">{n.author} · {formatDateTime(n.at)}</p>
              </div>
            ))}
            {applicant.recruiterNotes.length === 0 && <p className="text-sm text-slate-400">No notes yet.</p>}
          </div>
          <div className="mt-2 flex gap-2">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" />
            <Button variant="outline" disabled={!note.trim()} onClick={async () => { await addNote(applicant, user.name, note.trim()); setNote(''); toast.success('Note added') }}>Add</Button>
          </div>
        </section>
      </div>
    </Modal>
  )
}

function InfoRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className="text-slate-400">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  )
}

function InterviewRow({ applicant, round }: { applicant: TeacherApplicant; round: InterviewRound }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 p-3 text-sm">
      <span className="flex items-center gap-1.5 text-slate-600">
        {round.mode === 'online' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
        {formatDateTime(round.scheduledAt)}
      </span>
      <span className="text-slate-400">· {round.interviewer}</span>
      <div className="ml-auto flex items-center gap-2">
        {round.result && round.result !== 'pending' ? (
          <Badge tone={round.result === 'pass' ? 'green' : 'red'}>{round.result === 'pass' ? 'Passed' : 'Failed'}</Badge>
        ) : (
          <>
            <Button size="sm" variant="success" onClick={() => setInterviewResult(applicant, round.id, 'pass', 'Cleared')}>Pass</Button>
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => setInterviewResult(applicant, round.id, 'fail', 'Did not clear')}>Fail</Button>
          </>
        )}
      </div>
      {round.notes && <p className="w-full text-xs text-slate-400">{round.notes}</p>}
    </div>
  )
}
