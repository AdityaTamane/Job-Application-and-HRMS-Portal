import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Megaphone, Send, Users, Radio } from 'lucide-react'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { sendAnnouncement, AUDIENCE_LABELS } from '@/lib/announcements'
import type { AnnouncementAudience } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/misc'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Field, Input, Textarea, Select } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'
import { timeAgo } from '@/lib/utils'

const AUDIENCES: AnnouncementAudience[] = ['all', 'students', 'customers', 'teachers']

export function AdminAnnouncements() {
  const { user } = useAuth()
  const [form, setForm] = useState({ title: '', body: '', audience: 'all' as AnnouncementAudience })
  const [sending, setSending] = useState(false)
  const history = useLiveQuery(() => db.announcements.reverse().sortBy('createdAt'), [])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!form.title.trim() || !form.body.trim()) return toast.error('Add a title and message')
    setSending(true)
    try {
      const n = await sendAnnouncement(form, { id: user.id, name: user.name })
      toast.success('Announcement sent', `Delivered to ${n} ${n === 1 ? 'person' : 'people'}.`)
      setForm({ title: '', body: '', audience: 'all' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Broadcast a message to students, customers or teachers" />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Composer */}
        <Card className="lg:col-span-2">
          <CardHeader title="New announcement" />
          <CardBody>
            <form onSubmit={submit} className="space-y-4">
              <Field label="Audience">
                <Select value={form.audience} onChange={(e) => set('audience', e.target.value)}>
                  {AUDIENCES.map((a) => <option key={a} value={a}>{AUDIENCE_LABELS[a]}</option>)}
                </Select>
              </Field>
              <Field label="Title" required>
                <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. High demand this weekend" maxLength={80} required />
              </Field>
              <Field label="Message" required>
                <Textarea value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="Write your message…" rows={4} maxLength={280} required />
              </Field>
              <Button type="submit" className="w-full" icon={<Send className="h-4 w-4" />} loading={sending}>Send announcement</Button>
              <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <Radio className="h-3.5 w-3.5" /> Recipients get it instantly in their notification bell.
              </p>
            </form>
          </CardBody>
        </Card>

        {/* History */}
        <Card className="lg:col-span-3">
          <CardHeader title="Sent" subtitle={`${history?.length ?? 0} announcements`} />
          <CardBody>
            {!history?.length ? (
              <EmptyState icon={<Megaphone className="h-6 w-6" />} title="No announcements yet" description="Broadcasts you send will be listed here." />
            ) : (
              <div className="space-y-3">
                {history.map((a) => (
                  <div key={a.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{a.title}</p>
                      <Badge tone="blue">{AUDIENCE_LABELS[a.audience]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{a.body}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                      <Users className="h-3.5 w-3.5" /> {a.recipientCount} recipients · {a.sentByName} · {timeAgo(a.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
