import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../App'
import { AuthProvider } from '../../app/auth/AuthProvider'
import type { UserRole } from '../../app/auth/types'
import { switchActiveRole } from '../../api/session'

vi.mock('../../api/session', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../api/session')>(), switchActiveRole: vi.fn(),
}))
beforeEach(() => { localStorage.clear(); vi.mocked(switchActiveRole).mockReset() })
function setup(roles: UserRole[] = ['ATHLETE', 'TRAINER']) {
  localStorage.setItem('accessToken', 'old-token')
  localStorage.setItem('cb-session', JSON.stringify({ user: {
    id: 'profile-user', email: 'review@example.com', displayName: 'Иван Петров', roles,
  }, activeRole: roles.includes('ADMIN') ? 'ADMIN' : roles[0] }))
  const user = userEvent.setup()
  render(<QueryClientProvider client={new QueryClient()}><AuthProvider><MemoryRouter initialEntries={['/profile']}><App /></MemoryRouter></AuthProvider></QueryClientProvider>)
  return user
}
it('переключает роль через общий API, меняет меню и сохраняет выход', async () => {
  vi.mocked(switchActiveRole).mockResolvedValue({ accessToken: 'trainer-token', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z', user: {
    id: 'profile-user', email: 'review@example.com', displayName: 'Иван Петров', roles: ['ATHLETE', 'TRAINER'], activeRole: 'TRAINER',
  } })
  const user = setup()
  await user.click(await screen.findByRole('combobox', { name: 'Активная роль' }))
  await user.click(await screen.findByTitle('Тренер'))
  expect(await screen.findByRole('link', { name: 'Атлеты' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'История' })).not.toBeInTheDocument()
  expect(switchActiveRole).toHaveBeenCalledExactlyOnceWith('TRAINER')
  expect(localStorage.getItem('accessToken')).toBe('trainer-token')
  await user.click(screen.getByRole('link', { name: 'Профиль' }))
  expect(await screen.findByText('Тренерское')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Выйти' }))
  expect(await screen.findByRole('button', { name: 'Войти' })).toBeInTheDocument()
  expect(localStorage.getItem('cb-session')).toBeNull()
})
it('оставляет прежнюю роль при ошибке API', async () => {
  vi.mocked(switchActiveRole).mockRejectedValue(new Error('network'))
  const user = setup()
  await user.click(await screen.findByRole('combobox', { name: 'Активная роль' }))
  await user.click(await screen.findByTitle('Тренер'))
  expect(await screen.findByText('Не удалось переключить роль')).toBeInTheDocument()
  expect(screen.getByText('Антропометрия и тренировки')).toBeInTheDocument()
  expect(localStorage.getItem('accessToken')).toBe('old-token')
})
it.each<UserRole[][]>([['ATHLETE'], ['TRAINER'], ['ADMIN'], ['ADMIN', 'ATHLETE', 'TRAINER']].map(roles => [roles as UserRole[]]))('скрывает переключатель для набора ролей %j', async (roles) => {
  setup(roles)
  await screen.findByRole('button', { name: 'Редактировать профиль' })
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
})
