import { Link } from 'react-router-dom'
import { Check, Video, MapPin, Clock, PartyPopper, XCircle, CalendarDays } from 'lucide-react'
import { useApplicant } from '@/hooks/useApplicant'
import { STAGES } from '@/lib/ats'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader, EmptyState } from '@/components/ui/misc'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge, StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn, formatDateTime } from '@/lib/utils'

export function MyApplication() {
  const applicant = useApplicant()
  if (applicant === undefined) return <PageLoader />
  if (!applicant) {
    return (
      <div>
        <PageHeader title="My Application" />
        <EmptyState title="No application found" description="We couldn't find an application linked to your account." action={<Link to="/register?role=teacher"><Button>Apply now</Button></Link>} />
      </div>
    )
  }

  const rejected = applicant.stage === 'rejected'
  const hired = applicant.stage === 'hired'
  const currentIdx = STAGES.findIndex((s) => s.stage === applicant.stage)

  return (
    <div>
      <PageHeader title="My Application" subtitle={`${applicant.subject} · applied ${formatDateTime(applicant.appliedAt)}`} actions={<StatusPill status={applicant.stage} />} />

      {/* Outcome banners */}
      {hired && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 p-5 text-emerald-800">
          <PartyPopper className="h-8 w-8" />
          <div>
            <h3 className="text-lg font-bold">Congratulations — you're hired! 🎉</h3>
            <p className="text-sm opacity-90">Our HR team will reach out with onboarding details shortly.</p>
          </div>
        </div>
      )}
      {rejected && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 p-5 text-red-700">
          <XCircle className="h-8 w-8" />
          <div>
            <h3 className="text-lg font-bold">Application closed</h3>
            <p className="text-sm opacity-90">Thank you for your interest. We won't be moving forward at this time — you're welcome to apply again in future.</p>
          </div>
        </div>
      )}

      {/* Pipeline stepper */}
      {!rejected && (
        <Card className="mb-6">
          <CardHeader title="Your progress" />
          <CardBody>
            <div className="flex items-center">
              {STAGES.map((s, i) => {
                const done = i < currentIdx || hired
                const active = i === currentIdx && !hired
                return (
                  <div key={s.stage} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition',
                        done && 'border-emerald-500 bg-emerald-500 text-white',
                        active && 'border-brand-500 bg-brand-50 text-brand-600',
                        !done && !active && 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-300',
                      )}>
                        {done ? <Check className="h-5 w-5" /> : i + 1}
                      </div>
                      <span className={cn('text-xs font-medium', active ? 'text-brand-600' : done ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500')}>{s.label}</span>
                    </div>
                    {i < STAGES.length - 1 && <div className={cn('mx-1 h-0.5 flex-1', done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700')} />}
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Interviews */}
      <Card>
        <CardHeader title="Interviews" subtitle="Scheduled rounds and outcomes" />
        <CardBody>
          {applicant.interviews.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No interviews scheduled yet" description="If you're shortlisted, interview invites will appear here." />
          ) : (
            <div className="space-y-3">
              {applicant.interviews.map((iv) => (
                <div key={iv.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 p-3.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    {iv.mode === 'online' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{iv.mode === 'online' ? 'Online interview' : 'In-person interview'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(iv.scheduledAt)} · with {iv.interviewer}</p>
                  </div>
                  {iv.result === 'pending' || !iv.result ? (
                    <Badge tone="amber"><Clock className="h-3 w-3" /> Upcoming</Badge>
                  ) : (
                    <Badge tone={iv.result === 'pass' ? 'green' : 'red'}>{iv.result === 'pass' ? 'Cleared' : 'Not cleared'}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
