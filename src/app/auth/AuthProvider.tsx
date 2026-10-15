import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './authContext'
import type { User, UserRole } from './types'

type Session = {
  user: User
  activeRole: UserRole
}

const SESSION_KEY = 'cb-session'
const LAST_ROLE_KEY = 'cb-last-role'

const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeStorage = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    return
  }
}

const readSession = (): Session | null => {
  const raw = readStorage(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

const createMockUser = (email: string): User => {
  const name = email.trim().toLowerCase()
  const roles: UserRole[] = name.startsWith('admin')
    ? ['ADMIN']
    : name.startsWith('trainer')
      ? ['TRAINER']
      : name.startsWith('athlete')
        ? ['ATHLETE']
        : ['ATHLETE', 'TRAINER']
  return { email: name, firstName: 'Иван', lastName: 'Петров', roles }
}

const resolveActiveRole = (roles: UserRole[]): UserRole => {
  if (roles.includes('ADMIN')) return 'ADMIN'
  if (roles.length === 1) return roles[0]
  const lastRole = readStorage(LAST_ROLE_KEY) as UserRole | null
  return lastRole && roles.includes(lastRole) ? lastRole : 'ATHLETE'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession)

  const saveSession = useCallback((next: Session | null) => {
    setSession(next)
    writeStorage(SESSION_KEY, next ? JSON.stringify(next) : null)
  }, [])

  const signIn = useCallback((email: string) => {
    const user = createMockUser(email)
    saveSession({ user, activeRole: resolveActiveRole(user.roles) })
  }, [saveSession])

  const signOut = useCallback(() => saveSession(null), [saveSession])

  const switchRole = useCallback((role: UserRole) => {
    if (!session || !session.user.roles.includes(role)) return
    writeStorage(LAST_ROLE_KEY, role)
    saveSession({ ...session, activeRole: role })
  }, [session, saveSession])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      activeRole: session?.activeRole ?? null,
      signIn,
      signOut,
      switchRole,
    }),
    [session, signIn, signOut, switchRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
