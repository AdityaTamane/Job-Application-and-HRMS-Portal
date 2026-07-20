import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { db, logAudit } from './db'
import { seedDatabase } from './seed'
import { uid } from './utils'
import type { Role, User } from './types'

const STORAGE_KEY = 'lighthouse.session'

interface AuthState {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<User>
  verifyCredentials: (email: string, password: string) => Promise<User>
  loginAs: (userId: string) => Promise<User>
  logout: () => void
  register: (data: Omit<User, 'id' | 'createdAt'>) => Promise<User>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      await seedDatabase()
      const savedId = localStorage.getItem(STORAGE_KEY)
      if (savedId) {
        const u = await db.users.get(savedId)
        if (u) setUser(u)
      }
      setReady(true)
    })()
  }, [])

  const persist = (u: User | null) => {
    if (u) localStorage.setItem(STORAGE_KEY, u.id)
    else localStorage.removeItem(STORAGE_KEY)
    setUser(u)
  }

  const login = async (email: string, password: string) => {
    const u = await db.users.where('email').equals(email.trim().toLowerCase()).first()
    if (!u || u.password !== password) throw new Error('Invalid email or password')
    persist(u)
    await logAudit(u.id, u.name, 'login', 'session')
    return u
  }

  // Validate credentials without starting a session — used before a 2FA step.
  const verifyCredentials = async (email: string, password: string) => {
    const u = await db.users.where('email').equals(email.trim().toLowerCase()).first()
    if (!u || u.password !== password) throw new Error('Invalid email or password')
    return u
  }

  const loginAs = async (userId: string) => {
    const u = await db.users.get(userId)
    if (!u) throw new Error('User not found')
    persist(u)
    return u
  }

  const register = async (data: Omit<User, 'id' | 'createdAt'>) => {
    const existing = await db.users.where('email').equals(data.email.trim().toLowerCase()).first()
    if (existing) throw new Error('An account with this email already exists')
    const u: User = { ...data, email: data.email.trim().toLowerCase(), id: uid('u'), createdAt: Date.now() }
    await db.users.add(u)
    persist(u)
    return u
  }

  const logout = () => persist(null)

  const refresh = async () => {
    if (!user) return
    const u = await db.users.get(user.id)
    if (u) setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, verifyCredentials, loginAs, logout, register, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const HOME_BY_ROLE: Record<Role, string> = {
  customer: '/customer',
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
  employee: '/hrms',
}
