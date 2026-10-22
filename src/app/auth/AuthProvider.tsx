import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ACCESS_TOKEN_KEY } from '../../api/http'
import { getApiErrorStatus, login, switchActiveRole } from '../../api/session'
import type { AuthResponse } from '../../api/session'
import { AuthContext } from './authContext'
import type { User, UserRole } from './types'

type Session = {
  user: User
  activeRole: UserRole
}

const SESSION_KEY = 'cb-session'

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
  if (!raw || !readStorage(ACCESS_TOKEN_KEY)) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

const toSession = ({ user }: AuthResponse): Session => ({
  user: { id: user.id, email: user.email, displayName: user.displayName, roles: user.roles },
  activeRole: user.activeRole,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(readSession)
  const [switching, setSwitching] = useState(false)
  const switchingRef = useRef(false)

  const saveSession = useCallback((next: Session | null, token: string | null) => {
    writeStorage(ACCESS_TOKEN_KEY, token)
    writeStorage(SESSION_KEY, next ? JSON.stringify(next) : null)
    setSession(next)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await login(email, password)
    saveSession(toSession(response), response.accessToken)
  }, [saveSession])

  const signOut = useCallback(() => {
    queryClient.clear()
    saveSession(null, null)
  }, [queryClient, saveSession])

  const switchRole = useCallback(async (role: UserRole) => {
    if (!session || switchingRef.current || role === session.activeRole) return
    if (!session.user.roles.includes(role)) return
    switchingRef.current = true
    setSwitching(true)
    try {
      const response = await switchActiveRole(role)
      queryClient.clear()
      saveSession(toSession(response), response.accessToken)
    } catch (error) {
      if (getApiErrorStatus(error) === 401) saveSession(null, null)
      throw error
    } finally {
      switchingRef.current = false
      setSwitching(false)
    }
  }, [session, queryClient, saveSession])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      activeRole: session?.activeRole ?? null,
      switching,
      signIn,
      signOut,
      switchRole,
    }),
    [session, switching, signIn, signOut, switchRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
