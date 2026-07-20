import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, HOME_BY_ROLE } from '@/lib/auth'
import { PageLoader } from '@/components/ui/misc'
import type { Role } from '@/lib/types'

export function RequireAuth({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <PageLoader />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!roles.includes(user.role)) return <Navigate to={HOME_BY_ROLE[user.role]} replace />
  return <>{children}</>
}
