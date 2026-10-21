import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProfileScreen } from '../features/profile/ProfileScreen'
import { createAvatarApi } from '../features/profile/avatarApi'
import { createProfileApi } from '../features/profile/profileApi'
import { useAuth } from '../app/auth/useAuth'
import { readSession } from '../app/auth/sessionStorage'

export function ProfilePage() {
  const { user, activeRole, switchRole, signOut, updateCurrentUser } = useAuth()
  const navigate = useNavigate()
  const api = useMemo(() => createProfileApi(() => readSession()?.accessToken ?? null, user?.id), [user?.id])
  const avatarApi = useMemo(() => createAvatarApi(() => readSession()?.accessToken ?? null), [])
  if (!user || !activeRole) return null

  return <ProfileScreen
    api={api}
    avatarApi={avatarApi}
    accountId={user.id}
    activeRole={activeRole}
    roles={user.roles}
    onRoleChange={switchRole}
    onSessionExpired={signOut}
    onSaved={(profile) => updateCurrentUser({
      id: profile.id,
      email: profile.email,
      displayName: profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.email,
    })}
    onSignOut={() => { signOut(); navigate('/login', { replace: true }) }}
  />
}
