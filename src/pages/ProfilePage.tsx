import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/auth/useAuth'
import { createMockProfileApi, initialProfile } from '../features/profile/mockProfileApi'
import { ProfileScreen } from '../features/profile/ProfileScreen'

export function ProfilePage() {
  const { user, activeRole, switchRole, signOut } = useAuth()
  const navigate = useNavigate()
  const client = useQueryClient()
  const api = useMemo(() => createMockProfileApi({ profile: {
    ...initialProfile, email: user?.email ?? initialProfile.email,
    roles: user?.roles ?? initialProfile.roles,
    firstName: user?.firstName ?? null, lastName: user?.lastName ?? null,
  } }), [user?.email, user?.firstName, user?.lastName, user?.roles])
  if (!user || !activeRole) return null
  return <ProfileScreen key={user.email} accountKey={user.email} api={api} activeRole={activeRole} roles={user.roles}
    onRoleChange={switchRole} onSignOut={() => { signOut(); client.clear(); navigate('/login', { replace: true }) }} />
}