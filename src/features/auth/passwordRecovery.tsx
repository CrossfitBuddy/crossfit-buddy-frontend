import { useState } from 'react'
import type { ReactNode } from 'react'
import { AuthError } from './authApi'
import { RecoveryContext } from './recoveryContext'
import type { RecoveryApi } from './recoveryContext'

const unavailableApi: RecoveryApi = {
  requestCode: async () => { throw new AuthError('RECOVERY_UNAVAILABLE') },
  resetPassword: async () => { throw new AuthError('RECOVERY_UNAVAILABLE') },
}

export function RecoveryProvider({ children, api = unavailableApi }: { children: ReactNode; api?: RecoveryApi }) {
  const [email, setEmail] = useState('')
  return <RecoveryContext.Provider value={{ email, setEmail, api }}>{children}</RecoveryContext.Provider>
}
