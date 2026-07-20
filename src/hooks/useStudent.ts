import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useAuth } from '@/lib/auth'

/** Returns the Student record for the currently-logged-in student user (or undefined). */
export function useStudent() {
  const { user } = useAuth()
  return useLiveQuery(async () => {
    if (!user) return undefined
    if (user.refId) {
      const byRef = await db.students.get(user.refId)
      if (byRef) return byRef
    }
    return db.students.where('userId').equals(user.id).first()
  }, [user?.id, user?.refId])
}
