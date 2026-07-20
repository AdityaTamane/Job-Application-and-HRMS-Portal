import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'

/** Returns the TeacherApplicant record for the logged-in teacher user (or undefined). */
export function useApplicant() {
  const { user } = useAuth()
  return useLiveQuery(async () => {
    if (!user) return undefined
    if (user.refId) {
      const byRef = await db.applicants.get(user.refId)
      if (byRef) return byRef
    }
    return db.applicants.where('email').equals(user.email.toLowerCase()).first()
  }, [user?.id, user?.refId])
}
