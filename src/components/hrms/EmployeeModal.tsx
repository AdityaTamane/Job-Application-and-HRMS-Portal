import { useEffect, useState, type FormEvent } from 'react'
import type { Employee, EmployeeStatus, EmploymentType } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import { addEmployee, updateEmployee } from '@/lib/hrms'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'

const DEPARTMENTS = ['Academy', 'Administration', 'Placements', 'Human Resources', 'Operations']

const empty = {
  name: '', email: '', phone: '', designation: '', department: 'Academy',
  employmentType: 'full_time' as EmploymentType, status: 'active' as EmployeeStatus,
  joinDate: new Date().toISOString().slice(0, 10), monthlySalary: '40000',
}

export function EmployeeModal({ employee, open, onClose }: { employee: Employee | null; open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const editing = !!employee

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name, email: employee.email, phone: employee.phone, designation: employee.designation,
        department: employee.department, employmentType: employee.employmentType, status: employee.status,
        joinDate: employee.joinDate, monthlySalary: String(employee.monthlySalary),
      })
    } else {
      setForm(empty)
    }
  }, [employee, open])

  if (!user) return null
  const admin = { id: user.id, name: user.name }
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name, email: form.email, phone: form.phone, designation: form.designation,
        department: form.department, employmentType: form.employmentType, status: form.status,
        joinDate: form.joinDate, monthlySalary: Number(form.monthlySalary) || 0,
      }
      if (editing && employee) {
        await updateEmployee(employee.id, payload, admin)
        toast.success('Employee updated')
      } else {
        await addEmployee(payload, admin)
        toast.success('Employee added')
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit employee' : 'Add employee'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" required><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required /></Field>
          <Field label="Phone" required><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} required /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Designation" required><Input value={form.designation} onChange={(e) => set('designation', e.target.value)} required /></Field>
          <Field label="Department">
            <Select value={form.department} onChange={(e) => set('department', e.target.value)}>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Type">
            <Select value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
              <option value="contract">Contract</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="on_leave">On leave</option>
              <option value="terminated">Terminated</option>
            </Select>
          </Field>
          <Field label="Salary (₹)"><Input type="number" value={form.monthlySalary} onChange={(e) => set('monthlySalary', e.target.value)} /></Field>
        </div>
        <Field label="Join date"><Input type="date" value={form.joinDate} onChange={(e) => set('joinDate', e.target.value)} /></Field>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={saving}>{editing ? 'Save changes' : 'Add employee'}</Button>
        </div>
      </form>
    </Modal>
  )
}
