import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProfileScreen } from '../features/profile/ProfileScreen'
import { createProfileApi } from '../features/profile/profileApi'
import { useAuth } from '../app/auth/useAuth'
import { readSession } from '../app/auth/sessionStorage'

export function ProfilePage() {
  const { user, activeRole, switchRole, signOut, updateCurrentUser } = useAuth()
  const navigate = useNavigate()
  const api = useMemo(() => createProfileApi(() => readSession()?.accessToken ?? null, user?.id), [user?.id])
  if (!user || !activeRole) return null

  return <ProfileScreen
    key={user.id}
    api={api}
    accountId={user.id}
    activeRole={activeRole}
    roles={user.roles}
    onRoleChange={async (role) => {
      const changed = await switchRole(role)
      if (changed) navigate('/', { replace: true })
      return changed
    }}
    onSessionExpired={signOut}
    onSaved={(profile) => updateCurrentUser({
      id: profile.id,
      email: profile.email,
      displayName: profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.email,
    })}
    onSignOut={() => { signOut(); navigate('/login', { replace: true }) }}
  />
}
