import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { X, Plus } from 'lucide-react'
import { db } from '@/lib/db'
import { NEIGHBOURHOODS } from '@/lib/seed'
import { updateStudentProfile } from '@/lib/student'
import { useStudent } from '@/hooks/useStudent'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader } from '@/components/ui/misc'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Field, Input, Textarea, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export function StudentProfile() {
  const student = useStudent()
  const categories = useLiveQuery(() => db.categories.toArray(), [])

  const [form, setForm] = useState<{
    bio: string
    hourlyRate: string
    serviceRadiusKm: string
    neighbourhood: string
    skills: string[]
    serviceCategoryIds: string[]
  } | null>(null)
  const [skillDraft, setSkillDraft] = useState('')
  const [saving, setSaving] = useState(false)

  // initialise form once student loads
  if (student && !form) {
    setForm({
      bio: student.bio,
      hourlyRate: String(student.hourlyRate),
      serviceRadiusKm: String(student.serviceRadiusKm),
      neighbourhood: student.neighbourhood,
      skills: [...student.skills],
      serviceCategoryIds: [...student.serviceCategoryIds],
    })
  }

  if (!student || !form) return <PageLoader />

  const addSkill = () => {
    const v = skillDraft.trim()
    if (v && !form.skills.includes(v)) setForm({ ...form, skills: [...form.skills, v] })
    setSkillDraft('')
  }
  const onSkillKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }
  const toggleCat = (id: string) => {
    setForm({
      ...form,
      serviceCategoryIds: form.serviceCategoryIds.includes(id)
        ? form.serviceCategoryIds.filter((c) => c !== id)
        : [...form.serviceCategoryIds, id],
    })
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const geo = NEIGHBOURHOODS[form.neighbourhood]
    setSaving(true)
    try {
      await updateStudentProfile(student, {
        bio: form.bio,
        hourlyRate: Number(form.hourlyRate) || student.hourlyRate,
        serviceRadiusKm: Number(form.serviceRadiusKm) || student.serviceRadiusKm,
        neighbourhood: form.neighbourhood,
        lat: geo.lat,
        lng: geo.lng,
        skills: form.skills,
        serviceCategoryIds: form.serviceCategoryIds,
      })
      toast.success('Profile saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="This is what customers see when they find you" />

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <Avatar src={student.photoUrl} name={student.name} size={88} />
            <h3 className="mt-3 text-lg font-bold text-slate-900">{student.name}</h3>
            <p className="text-sm text-slate-500">{student.email}</p>
            <div className="mt-2">
              {student.badgeTier !== 'none' ? (
                <VerifiedBadge tier={student.badgeTier} />
              ) : (
                <span className="text-xs text-slate-400">Not verified yet</span>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-400">{student.academyBatch} · Graduated {student.graduationDate}</p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Editable details" />
          <CardBody className="space-y-4">
            <Field label="Bio" hint="A short intro shown on your profile">
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell customers about your experience…" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Hourly rate (₹)" required>
                <Input type="number" min="50" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
              </Field>
              <Field label="Service radius (km)">
                <Input type="number" min="1" max="20" value={form.serviceRadiusKm} onChange={(e) => setForm({ ...form, serviceRadiusKm: e.target.value })} />
              </Field>
              <Field label="Neighbourhood">
                <Select value={form.neighbourhood} onChange={(e) => setForm({ ...form, neighbourhood: e.target.value })}>
                  {Object.keys(NEIGHBOURHOODS).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Services you offer">
              <div className="flex flex-wrap gap-2">
                {categories?.map((c) => {
                  const on = form.serviceCategoryIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCat(c.id)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                        on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300',
                      )}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Skills">
              <div className="flex gap-2">
                <Input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)} onKeyDown={onSkillKey} placeholder="Add a skill and press Enter" />
                <Button type="button" variant="outline" icon={<Plus className="h-4 w-4" />} onClick={addSkill}>Add</Button>
              </div>
              {form.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-sm text-slate-700">
                      {s}
                      <button type="button" onClick={() => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })}>
                        <X className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Field>

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>Save profile</Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  )
}
