import { db, logAudit, notify } from './db'
import { uid } from './utils'
import type { AnnouncementAudience, Role } from './types'

const AUDIENCE_ROLES: Record<AnnouncementAudience, Role[] | null> = {
  all: null, // everyone except admins
  students: ['student'],
  customers: ['customer'],
  teachers: ['teacher'],
}

export const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all: 'Everyone',
  students: 'Students',
  customers: 'Customers',
  teachers: 'Teachers',
}

/** Broadcast an announcement to a role audience; fans out as one notification per user. */
export async function sendAnnouncement(
  data: { title: string; body: string; audience: AnnouncementAudience },
  admin: { id: string; name: string },
) {
  const roles = AUDIENCE_ROLES[data.audience]
  const users = await db.users.toArray()
  const recipients = users.filter(
    (u) => u.id !== admin.id && u.role !== 'admin' && (roles ? roles.includes(u.role) : true),
  )
  await Promise.all(recipients.map((u) => notify(u.id, data.title, data.body, 'info')))
  await db.announcements.add({
    id: uid('ann'),
    title: data.title,
    body: data.body,
    audience: data.audience,
    sentById: admin.id,
    sentByName: admin.name,
    recipientCount: recipients.length,
    createdAt: Date.now(),
  })
  await logAudit(admin.id, admin.name, 'send_announcement', data.audience, `${recipients.length} recipients`)
  return recipients.length
}
