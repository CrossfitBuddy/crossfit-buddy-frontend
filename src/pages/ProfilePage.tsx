import { Button, Select } from 'antd'
import { useNavigate } from 'react-router-dom'
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
  if (!user || !activeRole) return null

  const logout = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  const switchableRoles = user.roles.filter((role) => role !== 'ADMIN')

  return (
    <>
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <h1 className="text-3xl font-black">{user.firstName} {user.lastName}</h1>
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
              onChange={switchRole}
              options={switchableRoles.map((role) => ({ value: role, label: roleLabels[role] }))}
            />
          ) : (
            <p className="text-lg font-bold">{roleLabels[activeRole]}</p>
          )}
        </div>
        <Button block size="large" onClick={logout}>Выйти</Button>
      </section>
    </>
  )
}
