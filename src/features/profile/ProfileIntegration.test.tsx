import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const transport = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock('./profileApi', async (importOriginal) => {
  const module = await importOriginal<typeof import('./profileApi')>()
  return { ...module, createProfileApi: () => ({ getProfile: transport.get, updateProfile: transport.put }) }
})
import { App } from '../../App'
import { AuthProvider } from '../../app/auth/AuthProvider'
import { useAuth } from '../../app/auth/useAuth'
import { writeSession, readSession } from '../../app/auth/sessionStorage'
import type { AuthSession } from '../../app/auth/types'
import { initialProfile } from './mockProfileApi'
import { ProfileError } from './profileApi'

const session: AuthSession = {
  accessToken: 'profile-token', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z',
  user: { id: initialProfile.id, email: initialProfile.email, displayName: 'Иван Петров', roles: ['ATHLETE', 'TRAINER'], activeRole: 'ATHLETE' },
}
function Store() {
  const auth = useAuth()
  const location = useLocation()
  return <><output data-testid="account-name">{auth.user?.displayName}</output><output data-testid="location">{location.pathname}</output></>
}
function setup() {
  writeSession(session)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const auth = {
    login: vi.fn().mockResolvedValue(session),
    account: vi.fn().mockResolvedValue(session.user),
    switchRole: vi.fn().mockResolvedValue({ ...session, accessToken: 'trainer-token', user: { ...session.user, activeRole: 'TRAINER' } }),
  }
  render(<QueryClientProvider client={client}><AuthProvider api={auth}><MemoryRouter initialEntries={['/profile']}><App /><Store /></MemoryRouter></AuthProvider></QueryClientProvider>)
  return { user: userEvent.setup(), auth, client }
}
async function edit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Редактировать профиль' }))
}
beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  transport.get.mockResolvedValue(structuredClone(initialProfile))
  transport.put.mockImplementation(async (request) => ({ ...initialProfile, ...request }))
})
describe('Интеграция профиля с общей сессией', () => {
  it('обновляет данные общего пользователя и сохранённой сессии после PUT', async () => {
    const { user } = setup()
    await edit(user)
    await user.clear(screen.getByLabelText('Имя'))
    await user.type(screen.getByLabelText('Имя'), 'Анна')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Изменения сохранены')).toBeInTheDocument()
    expect(screen.getByTestId('account-name')).toHaveTextContent('Анна Петров')
    expect(readSession()?.user.displayName).toBe('Анна Петров')
    expect(readSession()?.accessToken).toBe('profile-token')
    expect(readSession()?.user.roles).toEqual(['ATHLETE', 'TRAINER'])
    expect(transport.put.mock.calls[0][0]).not.toHaveProperty('roles')
  })

  it('подсвечивает backend-ошибку, сохраняет правки и разрешает повторное сохранение', async () => {
    transport.put.mockRejectedValueOnce(new ProfileError('Сервер отклонил данные.', 422, [{ field: 'firstName', message: 'Проверьте значение поля' }]))
    const { user } = setup()
    await edit(user)
    await user.clear(screen.getByLabelText('Имя'))
    await user.type(screen.getByLabelText('Имя'), 'Анна')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Проверьте значение поля')).toBeInTheDocument()
    expect(screen.getByLabelText('Имя')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Имя')).toHaveValue('Анна')
    expect(screen.getByTestId('account-name')).toHaveTextContent('Иван Петров')
    await user.clear(screen.getByLabelText('Имя'))
    await user.type(screen.getByLabelText('Имя'), 'Мария')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Изменения сохранены')).toBeInTheDocument()
    expect(readSession()?.user.displayName).toBe('Мария Петров')
  })

  it('повторяет GET после ошибки загрузки', async () => {
    transport.get.mockRejectedValueOnce(new ProfileError('Нет соединения.'))
    const { user } = setup()
    await user.click(await screen.findByRole('button', { name: 'Повторить загрузку' }))
    expect(await screen.findByRole('heading', { name: 'Иван Петров' })).toBeInTheDocument()
    expect(transport.get).toHaveBeenCalledTimes(2)
  })

  it('после 401 очищает сессию и возвращает на вход', async () => {
    transport.get.mockRejectedValueOnce(new ProfileError('Сессия истекла.', 401))
    setup()
    expect(await screen.findByRole('heading', { name: 'Войти' })).toBeInTheDocument()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('при конфликте сохраняет форму до явной загрузки свежих данных', async () => {
    transport.put.mockRejectedValueOnce(new ProfileError('Профиль изменился на сервере.', 409))
    const { user } = setup()
    await edit(user)
    await user.clear(screen.getByLabelText('Имя'))
    await user.type(screen.getByLabelText('Имя'), 'Анна')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Профиль изменился на сервере.')).toBeInTheDocument()
    expect(screen.getByLabelText('Имя')).toHaveValue('Анна')
    transport.get.mockResolvedValueOnce({ ...initialProfile, firstName: 'Мария' })
    await user.click(screen.getByRole('button', { name: 'Загрузить заново и сбросить правки' }))
    expect(await screen.findByRole('heading', { name: 'Мария Петров' })).toBeInTheDocument()
    expect(transport.put).toHaveBeenCalledTimes(1)
  })

  it('получает роль из auth store, обновляет меню и заново загружает профиль', async () => {
    const { user, auth, client } = setup()
    await user.click(await screen.findByRole('combobox', { name: 'Активная роль' }))
    await user.click(await screen.findByTitle('Тренер'))
    await user.click(await screen.findByRole('link', { name: 'Профиль' }))
    expect(await screen.findByText('Тренерское')).toBeInTheDocument()
    expect(auth.switchRole).toHaveBeenCalledWith('TRAINER', 'profile-token')
    expect(screen.getByRole('link', { name: 'Атлеты' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'История' })).not.toBeInTheDocument()
    await waitFor(() => expect(client.getQueryData(['profile', initialProfile.id, 'TRAINER'])).toBeDefined())
  })
})
