import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/auth/useAuth'
import { createMockProfileApi, initialProfile } from '../features/profile/mockProfileApi'
import { ProfileScreen } from '../features/profile/ProfileScreen'

export function ProfilePage() {
  const { user, activeRole, switchRole, signOut } = useAuth()
  const navigate = useNavigate()
  const api = useMemo(() => createMockProfileApi({ profile: {
    ...initialProfile, email: user?.email ?? initialProfile.email,
    roles: user?.roles ?? initialProfile.roles,
    firstName: user?.firstName ?? null, lastName: user?.lastName ?? null,
  } }), [user?.email, user?.firstName, user?.lastName, user?.roles])
  if (!user || !activeRole) return null
  return <ProfileScreen key={user.email} api={api} activeRole={activeRole} roles={user.roles}
    onRoleChange={switchRole} onSignOut={() => { signOut(); navigate('/login', { replace: true }) }} />
}