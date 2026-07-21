import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, Plus, Users, Mail, Phone } from 'lucide-react'
import { db } from '@/lib/db'
import type { Employee } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/misc'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, StatusPill } from '@/components/ui/Badge'
import { EmployeeModal } from '@/components/hrms/EmployeeModal'
import { formatCurrency, formatDate } from '@/lib/utils'

export function Employees() {
  const employees = useLiveQuery(() => db.employees.toArray(), [])
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('all')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  const departments = useMemo(() => Array.from(new Set((employees ?? []).map((e) => e.department))), [employees])
  const filtered = useMemo(() => {
    let list = employees ?? []
    if (dept !== 'all') list = list.filter((e) => e.department === dept)
    if (q.trim()) {
      const query = q.toLowerCase()
      list = list.filter((e) => e.name.toLowerCase().includes(query) || e.designation.toLowerCase().includes(query))
    }
    return list
  }, [employees, dept, q])

  const openAdd = () => { setEditing(null); setModal(true) }
  const openEdit = (e: Employee) => { setEditing(e); setModal(true) }

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${employees?.length ?? 0} team members`}
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add employee</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input className="pl-9" placeholder="Search by name or role…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={dept} onChange={(e) => setDept(e.target.value)} className="sm:w-48">
          <option value="all">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-7 w-7" />} title="No employees found" description="Add your first team member or adjust filters." action={<Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add employee</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={e.name} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{e.name}</p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">{e.designation}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone="blue">{e.department}</Badge>
                    <StatusPill status={e.status} />
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {e.email}</p>
                <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {e.phone}</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Joined {formatDate(e.joinDate)}</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(e.monthlySalary)}/mo</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => openEdit(e)}>Edit</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <EmployeeModal employee={editing} open={modal} onClose={() => setModal(false)} />
    </div>
  )
}
