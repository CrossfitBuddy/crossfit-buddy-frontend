import { useState } from 'react'
import type { ReactNode } from 'react'
import { recoveryApi } from './recoveryApi'
import { RecoveryContext } from './recoveryContext'
import type { RecoveryApi } from './recoveryContext'

export function RecoveryProvider({ children, api = recoveryApi }: { children: ReactNode; api?: RecoveryApi }) {
  const [email, setEmail] = useState('')
  return <RecoveryContext.Provider value={{ email, setEmail, api }}>{children}</RecoveryContext.Provider>
}
