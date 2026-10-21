import { Alert, Button, Select } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authErrorMessage } from '../features/auth/authApi'
import { useAuth } from '../app/auth/useAuth'
import type { UserRole } from '../app/auth/types'

const roleLabels: Record<UserRole, string> = {
  ATHLETE: 'Атлет',
  TRAINER: 'Тренер',
  ADMIN: 'Администратор',
}

export function ProfilePage() {
  const { user, activeRole, switchRole, signOut } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  if (!user || !activeRole) return null

  const switchableRoles = user.roles.filter((role) => role !== 'ADMIN')

  return (
    <>
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <h1 className="text-3xl font-black">{user.displayName}</h1>
        <p className="mt-2 text-stone-300">{user.email}</p>
      </header>
      <section className="space-y-6 px-6 py-8">
        <div>
          <p className="mb-2 text-sm font-bold text-stone-600">Активная роль</p>
          {switchableRoles.length > 1 ? (
            <Select<UserRole>
              className="w-full"
              size="large"
              value={activeRole}
              disabled={pending}
              onChange={async (role) => { setPending(true); setError(''); try { await switchRole(role) } catch (error) { setError(authErrorMessage(error)) } finally { setPending(false) } }}
              options={switchableRoles.map((role) => ({ value: role, label: roleLabels[role] }))}
            />
          ) : (
            <p className="text-lg font-bold">{roleLabels[activeRole]}</p>
          )}
        </div>
        <div role="alert">{error && <Alert type="error" title={error} showIcon />}</div>
        <Button block size="large" disabled={pending} onClick={() => { signOut(); navigate('/login', { replace: true }) }}>Выйти</Button>
      </section>
    </>
  )
}
