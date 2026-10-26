import { Button, Select, App as AntApp } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getApiErrorCode } from '../api/session'
import { useAuth } from '../app/auth/useAuth'
import type { UserRole } from '../app/auth/types'

const roleLabels: Record<UserRole, string> = {
  ATHLETE: 'Атлет',
  TRAINER: 'Тренер',
  ADMIN: 'Администратор',
}

const switchableRoles: UserRole[] = ['ATHLETE', 'TRAINER']

export function ProfilePage() {
  const { user, activeRole, switching, switchRole, signOut } = useAuth()
  const { message } = AntApp.useApp()
  const navigate = useNavigate()
  if (!user || !activeRole) return null

  const logout = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  const canSwitchRole = !user.roles.includes('ADMIN') && switchableRoles.every((role) => user.roles.includes(role))

  const changeRole = async (role: UserRole) => {
    try {
      if (await switchRole(role)) navigate('/', { replace: true })
    } catch (error) {
      message.error(
        getApiErrorCode(error) === 'ACCESS_DENIED'
          ? 'Эта роль не назначена вашей учётной записи'
          : 'Не удалось сменить роль. Попробуйте ещё раз',
      )
    }
  }

  return (
    <>
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <h1 className="text-3xl font-black">{user.displayName}</h1>
        <p className="mt-2 text-stone-300">{user.email}</p>
      </header>
      <section className="space-y-6 px-6 py-8">
        <div>
          <p className="mb-2 text-sm font-bold text-stone-600">Активная роль</p>
          {canSwitchRole ? (
            <Select<UserRole>
              className="w-full"
              size="large"
              value={activeRole}
              loading={switching}
              disabled={switching}
              onChange={changeRole}
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
