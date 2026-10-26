import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/auth/useAuth'
import { createMockProfileApi, initialProfile } from '../features/profile/mockProfileApi'
import { ProfileScreen } from '../features/profile/ProfileScreen'

export function ProfilePage() {
  const { user, activeRole, switchRole, signOut } = useAuth()
  const navigate = useNavigate()
  const api = useMemo(() => createMockProfileApi({ profile: {
    ...initialProfile, id: user?.id ?? initialProfile.id, email: user?.email ?? initialProfile.email,
  } }), [user?.id, user?.email])
  if (!user || !activeRole) return null
  return <ProfileScreen key={user.id} accountKey={user.id} api={api} activeRole={activeRole} roles={user.roles}
    onRoleChange={async (role) => {
      const changed = await switchRole(role)
      if (changed) navigate('/', { replace: true })
      return changed
    }}
    onSignOut={() => { signOut(); navigate('/login', { replace: true }) }} />
}
