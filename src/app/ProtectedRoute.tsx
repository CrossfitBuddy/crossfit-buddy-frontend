import { Navigate, useLocation } from 'react-router-dom'
import { MobileShell } from './MobileShell'
import { useAuth } from './auth/useAuth'

export function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <MobileShell />
}
