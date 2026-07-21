import { create } from 'zustand'
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'info' | 'warning' | 'error'
interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
}

interface ToastStore {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: number) => void
}

let seq = 0
const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    seq += 1
    const id = seq
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4000)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))

/** Imperative helper usable outside React render. */
export const toast = {
  success: (title: string, message?: string) => useToastStore.getState().push({ type: 'success', title, message }),
  info: (title: string, message?: string) => useToastStore.getState().push({ type: 'info', title, message }),
  warning: (title: string, message?: string) => useToastStore.getState().push({ type: 'warning', title, message }),
  error: (title: string, message?: string) => useToastStore.getState().push({ type: 'error', title, message }),
}

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  info: <Info className="h-5 w-5 text-brand-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-beacon-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
}

export function ToastViewport() {
  const { toasts, dismiss } = useToastStore()
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'animate-fade-in flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lift dark:border-slate-700 dark:bg-slate-800',
          )}
        >
          {icons[t.type]}
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.title}</p>
            {t.message && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.message}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
