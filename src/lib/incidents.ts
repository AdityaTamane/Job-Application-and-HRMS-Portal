// ---------------------------------------------------------------------------
// Incident & dispute center — SOS alerts, disputes and complaints become
// tracked cases in an admin queue with status + resolution notes.
// ---------------------------------------------------------------------------

import { db, logAudit, notify } from './db'
import { uid } from './utils'
import type { IncidentCase, IncidentPriority, IncidentStatus, IncidentType, Role } from './types'

export interface NewIncident {
  type: IncidentType
  jobId?: string
  raisedById: string
  raisedByName: string
  raisedByRole: Role
  againstName?: string
  subject: string
  description: string
  priority?: IncidentPriority
  lat?: number
  lng?: number
}

export async function createIncident(input: NewIncident): Promise<IncidentCase> {
  const now = Date.now()
  const incident: IncidentCase = {
    id: uid('inc'),
    type: input.type,
    jobId: input.jobId,
    raisedById: input.raisedById,
    raisedByName: input.raisedByName,
    raisedByRole: input.raisedByRole,
    againstName: input.againstName,
    subject: input.subject,
    description: input.description,
    status: 'open',
    priority: input.priority ?? (input.type === 'sos' ? 'high' : 'medium'),
    lat: input.lat,
    lng: input.lng,
    createdAt: now,
    updatedAt: now,
  }
  await db.incidents.add(incident)
  const admin = await db.users.where('role').equals('admin').first()
  if (admin) {
    await notify(
      admin.id,
      input.type === 'sos' ? '🚨 SOS incident logged' : `New ${input.type} case`,
      `${input.subject} — from ${input.raisedByName}`,
      input.type === 'sos' ? 'warning' : 'action',
      '/admin/incidents',
    )
  }
  await logAudit(input.raisedById, input.raisedByName, `raise_${input.type}`, incident.id, input.subject)
  return incident
}

export async function setIncidentStatus(incident: IncidentCase, status: IncidentStatus, resolutionNote?: string) {
  await db.incidents.update(incident.id, { status, resolutionNote, updatedAt: Date.now() })
  // Let the reporter know when their case is closed out.
  if ((status === 'resolved' || status === 'dismissed') && incident.raisedById) {
    await notify(
      incident.raisedById,
      `Your case was ${status}`,
      `"${incident.subject}" — ${resolutionNote || 'Reviewed by the Lighthouse team.'}`,
      status === 'resolved' ? 'success' : 'info',
    )
  }
}

export const INCIDENT_META: Record<IncidentType, { label: string; icon: string }> = {
  sos: { label: 'SOS alert', icon: 'Siren' },
  dispute: { label: 'Dispute', icon: 'Scale' },
  complaint: { label: 'Complaint', icon: 'Flag' },
}
