import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Theme store — light / dark, persisted to localStorage, respects system pref.
// The initial `dark` class is applied by an inline script in index.html to
// avoid a flash-of-wrong-theme; this store keeps React in sync afterwards.
// ---------------------------------------------------------------------------

export type Theme = 'light' | 'dark'
const STORAGE_KEY = 'lighthouse.theme'

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function readInitial(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* ignore */
  }
  return systemPrefersDark() ? 'dark' : 'light'
}

function apply(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}

interface ThemeState {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: readInitial(),
  setTheme: (t) => {
    apply(t)
    set({ theme: t })
  },
  toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}))
