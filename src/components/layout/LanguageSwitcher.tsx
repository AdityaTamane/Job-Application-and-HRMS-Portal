import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Languages, Check } from 'lucide-react'
import { useI18n, LANGS, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * Header language toggle. Portals its menu to <body> so it isn't clipped by the
 * `.glass` header's backdrop-filter (same fix as the notification bell).
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0]

  const pick = (code: Lang) => {
    setLang(code)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label={t('lang.label')}
        title={t('lang.label')}
      >
        <Languages className="h-5 w-5" />
        {!compact && <span className="text-sm font-medium">{current.native}</span>}
      </button>
      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="fixed right-3 top-14 z-50 w-40 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift dark:border-slate-800 dark:bg-slate-900 sm:right-4 sm:top-16">
              <p className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
                {t('lang.label')}
              </p>
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => pick(l.code)}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800',
                    l.code === lang
                      ? 'font-semibold text-brand-600 dark:text-brand-300'
                      : 'text-slate-600 dark:text-slate-300',
                  )}
                >
                  <span>{l.native}</span>
                  {l.code === lang && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
