import { useMemo } from 'react'
import { ProfileScreen } from '../features/profile/ProfileScreen'
import { createProfileApi } from '../features/profile/profileApi'
import { useAuth } from '../app/auth/useAuth'
import { readSession } from '../app/auth/sessionStorage'

export function ProfilePage() {
  const { user, activeRole, switchRole, signOut, updateCurrentUser } = useAuth()
  const api = useMemo(() => createProfileApi(() => readSession()?.accessToken ?? null, user?.id), [user?.id])
  if (!user || !activeRole) return null

  return <ProfileScreen
    api={api}
    accountId={user.id}
    activeRole={activeRole}
    roles={user.roles}
    onRoleChange={switchRole}
    onSessionExpired={signOut}
    onSaved={(profile) => updateCurrentUser({
      id: profile.id,
      email: profile.email,
      displayName: [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.email,
    })}
    onSignOut={signOut}
  />
}
