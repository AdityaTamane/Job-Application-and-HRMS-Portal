// ---------------------------------------------------------------------------
// Lightweight i18n engine (feature: multi-language support).
// No dependency — a flat dot-keyed dictionary per language, a `useT()` hook,
// and {var} interpolation. Current language persists to localStorage and is
// mirrored onto <html lang="…"> for a11y. English is the fallback for any key
// missing in the active language, so partially-translated surfaces degrade
// gracefully to English rather than showing raw keys.
// ---------------------------------------------------------------------------

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { en } from './locales/en'
import { hi } from './locales/hi'

export type Lang = 'en' | 'hi'

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
]

const DICTS: Record<Lang, Record<string, string>> = { en, hi }
const STORAGE_KEY = 'lighthouse:lang'

function getInitialLang(): Lang {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  if (saved === 'en' || saved === 'hi') return saved
  return 'en'
}

export type Translate = (key: string, vars?: Record<string, string | number>) => string

interface I18nState {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translate
}

const I18nContext = createContext<I18nState | null>(null)

function interpolate(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore storage errors */
    }
    document.documentElement.lang = l
  }, [])

  const t = useCallback<Translate>(
    (key, vars) => {
      const raw = DICTS[lang][key] ?? DICTS.en[key] ?? key
      return interpolate(raw, vars)
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/** Shorthand: the translate function alone (the common case). */
export function useT() {
  return useI18n().t
}
