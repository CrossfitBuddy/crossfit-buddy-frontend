import type { ReactNode } from 'react'
import { ForbiddenPage } from '../pages/ErrorPages'
import { useAuth } from './auth/useAuth'
import type { UserRole } from './auth/types'

export function RoleGate({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { activeRole } = useAuth()

  if (!activeRole || !roles.includes(activeRole)) return <ForbiddenPage />
  return children
}
