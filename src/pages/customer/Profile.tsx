import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Briefcase, Star, CheckCircle2 } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatCard } from '@/components/ui/misc'
import { toast } from '@/components/ui/toast'

export function Profile() {
  const { user, refresh } = useAuth()
  const jobs = useLiveQuery(
    async () => (user ? db.jobs.where('customerId').equals(user.id).toArray() : []),
    [user?.id],
  )
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [saving, setSaving] = useState(false)
  if (!user) return null

  const completed = jobs?.filter((j) => j.status === 'completed').length ?? 0
  const total = jobs?.length ?? 0
  const spent = jobs?.filter((j) => j.status === 'completed').reduce((sum, j) => sum + j.estimatedPrice, 0) ?? 0

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await db.users.update(user.id, { name, phone })
      await refresh()
      toast.success('Profile updated')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your account details" />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total bookings" value={total} icon={<Briefcase className="h-5 w-5" />} />
        <StatCard label="Completed" value={completed} tone="green" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Total spent" value={`₹${spent.toLocaleString('en-IN')}`} tone="amber" icon={<Star className="h-5 w-5" />} />
      </div>

      <Card className="max-w-2xl">
        <CardHeader title="Account details" subtitle="This info helps pros reach you" />
        <CardBody>
          <div className="mb-5 flex items-center gap-4">
            <Avatar src={user.avatarUrl} name={user.name} size={64} />
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
          <form onSubmit={save} className="space-y-4">
            <Field label="Full name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" hint="Email can't be changed">
                <Input value={user.email} disabled />
              </Field>
              <Field label="Phone" required>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </Field>
            </div>
            <Button type="submit" loading={saving}>Save changes</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
