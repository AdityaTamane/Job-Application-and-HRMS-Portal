import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { X, Plus, Camera, Upload } from 'lucide-react'
import { db } from '@/lib/db'
import { NEIGHBOURHOODS } from '@/lib/seed'
import { updateStudentProfile, fileToDataUrl } from '@/lib/student'
import { SLOT_TIMES, WEEKDAYS_LONG, prettyTime } from '@/lib/availability'
import { CameraCaptureModal } from '@/components/common/CameraCaptureModal'
import { useStudent } from '@/hooks/useStudent'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader } from '@/components/ui/misc'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Field, Input, Textarea, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'
import { ProfileStrength } from '@/components/student/ProfileStrength'
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
    weeklyAvailability: Record<string, string[]>
  } | null>(null)
  const [skillDraft, setSkillDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const photoInput = useRef<HTMLInputElement>(null)

  // initialise form once student loads
  if (student && !form) {
    setForm({
      bio: student.bio,
      hourlyRate: String(student.hourlyRate),
      serviceRadiusKm: String(student.serviceRadiusKm),
      neighbourhood: student.neighbourhood,
      skills: [...student.skills],
      serviceCategoryIds: [...student.serviceCategoryIds],
      weeklyAvailability: student.weeklyAvailability ? { ...student.weeklyAvailability } : {},
    })
  }

  if (!student || !form) return <PageLoader />

  const savePhoto = async (dataUrl: string) => {
    setUploadingPhoto(true)
    try {
      await updateStudentProfile(student, { photoUrl: dataUrl })
      toast.success('Profile photo updated — used for check-in face-match')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    await savePhoto(await fileToDataUrl(file))
  }

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

  const toggleSlot = (dow: number, time: string) => {
    const key = String(dow)
    const cur = form.weeklyAvailability[key] ?? []
    const next = cur.includes(time) ? cur.filter((t) => t !== time) : [...cur, time]
    setForm({ ...form, weeklyAvailability: { ...form.weeklyAvailability, [key]: next } })
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
        weeklyAvailability: form.weeklyAvailability,
      })
      toast.success('Profile saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="This is what customers see when they find you" />

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-1">
          <Card>
          <CardBody className="flex flex-col items-center text-center">
            <div className="group relative">
              <Avatar src={student.photoUrl} name={student.name} size={88} />
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                aria-label="Take profile photo with camera"
                className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 dark:border-slate-900"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Camera className="h-4 w-4" />}
                loading={uploadingPhoto}
                onClick={() => setCameraOpen(true)}
              >
                Take photo
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Upload className="h-4 w-4" />}
                onClick={() => photoInput.current?.click()}
              >
                Upload
              </Button>
            </div>
            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">{student.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{student.email}</p>
            <div className="mt-2">
              {student.badgeTier !== 'none' ? (
                <VerifiedBadge tier={student.badgeTier} />
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">Not verified yet</span>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">{student.academyBatch} · Graduated {student.graduationDate}</p>
          </CardBody>
          </Card>
          <ProfileStrength student={student} />
        </div>

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
                        on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300',
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
                    <span key={s} className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-sm text-slate-700 dark:text-slate-200">
                      {s}
                      <button type="button" onClick={() => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })}>
                        <X className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Field>

            <Field label="Weekly availability" hint="Pick the time slots you're available each day — customers can only book these.">
              <div className="space-y-2">
                {WEEKDAYS_LONG.map((dayName, dow) => {
                  const selected = form.weeklyAvailability[String(dow)] ?? []
                  return (
                    <div key={dow} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <span className="w-24 shrink-0 text-sm font-medium text-slate-600 dark:text-slate-300">{dayName}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {SLOT_TIMES.map((t) => {
                          const on = selected.includes(t)
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => toggleSlot(dow, t)}
                              className={cn(
                                'rounded-lg border px-2.5 py-1 text-xs font-medium transition',
                                on
                                  ? 'border-brand-500 bg-brand-gradient text-white shadow-glow'
                                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400',
                              )}
                            >
                              {prettyTime(t)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Field>

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>Save profile</Button>
            </div>
          </CardBody>
        </Card>
      </form>

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={savePhoto}
        title="Take your profile photo"
      />
    </div>
  )
}
