import { createContext, useContext } from 'react'

export type PasswordReset = { email: string; code: string; password: string; passwordConfirmation: string }
export type RecoveryApi = {
  requestCode: (email: string) => Promise<void>
  resetPassword: (values: PasswordReset) => Promise<void>
}
export const RecoveryContext = createContext<{
  email: string
  setEmail: (email: string) => void
  api: RecoveryApi
} | null>(null)

export function useRecovery() {
  const context = useContext(RecoveryContext)
  if (!context) throw new Error('RecoveryProvider отсутствует')
  return context
}
