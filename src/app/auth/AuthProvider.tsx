import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AuthContext } from './authContext'
import type { AuthSession, UserRole } from './types'
import { authApi, AuthError, authErrorMessage, isUnauthorized } from '../../features/auth/authApi'
import type { AuthApi } from '../../features/auth/authApi'
import { clearSession, readSession, writeSession } from './sessionStorage'

export function AuthProvider({ children, api = authApi }: { children: ReactNode; api?: AuthApi }) {
  const [initial] = useState(readSession)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [restoring, setRestoring] = useState(Boolean(initial))
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [restoreAttempt, setRestoreAttempt] = useState(0)
  const generation = useRef(0)
  const [switching, setSwitching] = useState(false)
  const switchingRef = useRef(false)
  const queryClient = useQueryClient()

  const saveSession = useCallback((next: AuthSession) => {
    writeSession(next)
    queryClient.clear()
    setSession(next)
  }, [queryClient])

  const signOut = useCallback(() => {
    generation.current++
    switchingRef.current = false
    setSwitching(false)
    clearSession()
    queryClient.clear()
    setSession(null)
    setSessionError(null)
    setRestoring(false)
  }, [queryClient])

  useEffect(() => {
    if (!initial) return
    let cancelled = false
    const currentGeneration = generation.current
    api.account(initial.accessToken).then((user) => {
      if (cancelled || currentGeneration !== generation.current) return
      if (Date.parse(initial.expiresAt) <= Date.now()) { signOut(); return }
      saveSession({ ...initial, user })
      setSessionError(null)
    }).catch((error: unknown) => {
      if (cancelled || currentGeneration !== generation.current) return
      if (isUnauthorized(error) || (error instanceof AuthError && ['ACCOUNT_DISABLED', 'ACCESS_DENIED'].includes(error.code))) signOut()
      else setSessionError(authErrorMessage(error))
    }).finally(() => {
      if (!cancelled && currentGeneration === generation.current) setRestoring(false)
    })
    return () => { cancelled = true }
  }, [api, initial, restoreAttempt, saveSession, signOut])

  useEffect(() => {
    if (!session) return
    const timer = window.setTimeout(signOut, Math.min(Date.parse(session.expiresAt) - Date.now(), 2147483647))
    return () => window.clearTimeout(timer)
  }, [session, signOut])

  const signIn = useCallback(async (email: string, password: string) => {
    const currentGeneration = ++generation.current
    const response = await api.login(email, password)
    if (currentGeneration !== generation.current) return
    saveSession(response)
    setSessionError(null)
    setRestoring(false)
  }, [api, saveSession])

  const switchRole = useCallback(async (role: UserRole) => {
    if (!session || switchingRef.current || role === session.user.activeRole) return false
    if (!session.user.roles.includes(role) || session.user.roles.includes('ADMIN')) return false
    const currentGeneration = generation.current
    switchingRef.current = true
    setSwitching(true)
    try {
      const response = await api.switchRole(role, session.accessToken)
      if (currentGeneration !== generation.current) return false
      saveSession(response)
      return true
    } catch (error) {
      if (currentGeneration !== generation.current) return false
      if (isUnauthorized(error) || (error instanceof AuthError && error.code === 'ACCOUNT_DISABLED')) signOut()
      throw error
    } finally {
      if (currentGeneration === generation.current) {
        switchingRef.current = false
        setSwitching(false)
      }
    }
  }, [api, session, saveSession, signOut])

  const value = useMemo(() => ({
    user: session?.user ?? null,
    activeRole: session?.user.activeRole ?? null,
    switching,
    restoring,
    sessionError,
    retrySession: () => { setRestoring(true); setSessionError(null); setRestoreAttempt((value) => value + 1) },
    signIn, signOut, switchRole,
  }), [session, switching, restoring, sessionError, signIn, signOut, switchRole])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
