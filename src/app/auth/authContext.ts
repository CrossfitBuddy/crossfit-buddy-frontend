import { createContext } from 'react'
import type { User, UserRole } from './types'

export type AuthState = {
  user: User | null
  activeRole: UserRole | null
  switching: boolean
  restoring: boolean
  sessionError: string | null
  retrySession: () => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  switchRole: (role: UserRole) => Promise<boolean>
}
export const AuthContext = createContext<AuthState | null>(null)
