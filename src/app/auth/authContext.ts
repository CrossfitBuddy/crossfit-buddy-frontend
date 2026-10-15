import { createContext } from 'react'
import type { User, UserRole } from './types'

export type AuthState = {
  user: User | null
  activeRole: UserRole | null
  signIn: (email: string) => void
  signOut: () => void
  switchRole: (role: UserRole) => void
}

export const AuthContext = createContext<AuthState | null>(null)
