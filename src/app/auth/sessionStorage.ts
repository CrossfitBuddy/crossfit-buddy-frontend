import type { AuthSession } from './types'
import { AuthError, isSession } from '../../features/auth/authApi'

const sessionKey = 'cb-auth-session'

export function clearSession() {
  try {
    localStorage.removeItem(sessionKey)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('cb-session')
    localStorage.removeItem('cb-last-role')
  } catch { return }
}

export function readSession(): AuthSession | null {
  try {
    const session: unknown = JSON.parse(localStorage.getItem(sessionKey) ?? 'null')
    if (isSession(session) && localStorage.getItem('accessToken') === session.accessToken) return session
  } catch { clearSession(); return null }
  clearSession()
  return null
}

export function writeSession(session: AuthSession) {
  try {
    localStorage.setItem(sessionKey, JSON.stringify(session))
    localStorage.setItem('accessToken', session.accessToken)
  } catch {
    clearSession()
    throw new AuthError('STORAGE_ERROR')
  }
}
