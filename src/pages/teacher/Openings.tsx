import { Link } from 'react-router-dom'
import { GraduationCap, ArrowRight, Heart, Users, Sparkles, BookOpen } from 'lucide-react'
import { useApplicant } from '@/hooks/useApplicant'
import { useAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'

const SUBJECTS = [
  { name: 'Mathematics', icon: BookOpen },
  { name: 'Spoken English', icon: Users },
  { name: 'Computer Basics', icon: Sparkles },
  { name: 'Vocational — Electrical', icon: GraduationCap },
  { name: 'Beauty & Wellness', icon: Heart },
  { name: 'Life Skills', icon: Users },
]

const PERKS = [
  { title: 'Purpose-driven work', desc: 'Teach students from underserved communities and change lives.' },
  { title: 'Flexible formats', desc: 'Full-time, part-time and contract roles across subjects.' },
  { title: 'Supportive team', desc: 'Join a mission-first academy with strong mentorship.' },
]

export function Openings() {
  const { user } = useAuth()
  const applicant = useApplicant()

  return (
    <div>
      <PageHeader title="Teach with Lighthouse" subtitle="Help build livelihoods through education" />

      {/* Application status card */}
      {applicant && (
        <Card className="mb-6 border-brand-200 bg-brand-50/50">
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Your application for</p>
              <p className="text-lg font-bold text-slate-900">{applicant.subject}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill status={applicant.stage} />
              <Link to="/teacher/application">
                <Button icon={<ArrowRight className="h-4 w-4" />}>Track application</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600 p-8 text-white">
        <h2 className="max-w-lg text-2xl font-bold leading-snug">Every subject you teach becomes someone's first step to a career.</h2>
        <p className="mt-2 max-w-lg text-brand-100">We hire passionate trainers across academic and vocational subjects. Welcome, {user?.name.split(' ')[0]}.</p>
      </div>

      {/* Subjects */}
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Subjects we're hiring for</h3>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((s) => (
          <div key={s.name} className="card flex items-center gap-3 p-4">
            <span className="rounded-xl bg-beacon-50 p-2.5 text-beacon-600"><s.icon className="h-5 w-5" /></span>
            <span className="font-medium text-slate-800">{s.name}</span>
          </div>
        ))}
      </div>

      {/* Perks */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PERKS.map((p) => (
          <div key={p.title} className="card p-5">
            <h4 className="font-semibold text-slate-900">{p.title}</h4>
            <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
