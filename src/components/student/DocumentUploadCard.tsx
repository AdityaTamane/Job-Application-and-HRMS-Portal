import { useRef, useState, type ChangeEvent } from 'react'
import { Upload, FileCheck2, FileText, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { DocumentRecord, DocType, Student } from '@/lib/types'
import { uploadDocument } from '@/lib/student'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const STATUS_UI = {
  pending: { icon: Clock, cls: 'text-beacon-600 bg-beacon-50', label: 'Pending review' },
  approved: { icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50', label: 'Approved' },
  rejected: { icon: XCircle, cls: 'text-red-600 bg-red-50', label: 'Rejected' },
}

export function DocumentUploadCard({
  student,
  type,
  label,
  hint,
  doc,
  optional,
}: {
  student: Student
  type: DocType
  label: string
  hint: string
  doc?: DocumentRecord
  optional?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', 'Please upload a file under 5 MB.')
      return
    }
    setBusy(true)
    try {
      await uploadDocument(student, type, label, file)
      toast.success('Uploaded', `${label} added.`)
    } catch {
      toast.error('Upload failed')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const status = doc ? STATUS_UI[doc.status] : null
  const isImage = doc?.dataUrl.startsWith('data:image')

  return (
    <div className={cn('card p-4', doc?.status === 'rejected' && 'ring-1 ring-red-200')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn('rounded-xl p-2.5', doc ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400')}>
            {doc ? <FileCheck2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {label} {optional && <span className="text-xs font-normal text-slate-400">(optional)</span>}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
          </div>
        </div>
        {status && (
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', status.cls)}>
            <status.icon className="h-3.5 w-3.5" /> {status.label}
          </span>
        )}
      </div>

      {doc && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
          {isImage ? (
            <img src={doc.dataUrl} alt={label} className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
              <FileText className="h-5 w-5" />
            </div>
          )}
          <span className="truncate text-xs text-slate-500">{doc.fileName}</span>
        </div>
      )}

      {doc?.status === 'rejected' && doc.reviewNote && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{doc.reviewNote}</p>
      )}

      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} />
      <Button
        variant={doc ? 'outline' : 'primary'}
        size="sm"
        className="mt-3 w-full"
        loading={busy}
        disabled={doc?.status === 'approved'}
        icon={doc ? <RefreshCw className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
        onClick={() => inputRef.current?.click()}
      >
        {doc?.status === 'approved' ? 'Verified' : doc ? 'Replace' : 'Upload'}
      </Button>
    </div>
  )
}
