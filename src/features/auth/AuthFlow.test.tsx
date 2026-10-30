import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { InitialEntry } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../App'
import { AuthProvider } from '../../app/auth/AuthProvider'
import type { AuthSession } from '../../app/auth/types'
import { AuthError } from './authApi'
import type { AuthApi } from './authApi'
import { RecoveryProvider } from './passwordRecovery'
import type { RecoveryApi } from './recoveryContext'
import { writeSession } from '../../app/auth/sessionStorage'

vi.mock('../profile/profileApi', async (importOriginal) => {
  const module = await importOriginal<typeof import('../profile/profileApi')>()
  const { initialProfile } = await import('../profile/mockProfileApi')
  return { ...module, createProfileApi: () => ({
    getProfile: vi.fn().mockResolvedValue({ ...initialProfile, id: 'account-1', email: 'review@example.com', firstName: 'Анна', lastName: 'Рябова' }),
    updateProfile: vi.fn(),
  }) }
})
const session: AuthSession = {
  accessToken: 'test-token', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z',
  user: { id: 'account-1', email: 'review@example.com', displayName: 'Анна Рябова', roles: ['ATHLETE', 'TRAINER'], activeRole: 'ATHLETE' },
}
function Location() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search + location.hash}</output>
}
function setup({ api: overrides, recovery, entry = '/login' }: { api?: Partial<AuthApi>; recovery?: RecoveryApi; entry?: InitialEntry } = {}) {
  const api = {
    login: vi.fn().mockResolvedValue(structuredClone(session)),
    account: vi.fn().mockResolvedValue(structuredClone(session.user)),
    switchRole: vi.fn().mockResolvedValue({ ...session, accessToken: 'trainer-token', user: { ...session.user, activeRole: 'TRAINER' } }),
    ...overrides,
  } as AuthApi
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const result = render(<QueryClientProvider client={client}><AuthProvider api={api}><RecoveryProvider api={recovery}>
    <MemoryRouter initialEntries={[entry]}><App /><Location /></MemoryRouter>
  </RecoveryProvider></AuthProvider></QueryClientProvider>)
  return { ...result, api, client, user: userEvent.setup() }
}
async function fillLogin(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email'), 'review@example.com')
  await user.type(screen.getByLabelText('Пароль'), 'StrongPassword123!')
}
async function requestCode(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email'), 'review@example.com')
  await user.click(screen.getByRole('button', { name: 'Отправить код' }))
  await screen.findByLabelText('Код из письма')
}
async function fillReset(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Код из письма'), '123456')
  await user.type(screen.getByLabelText('Новый пароль'), 'StrongPassword123!')
  await user.type(screen.getByLabelText('Подтверждение пароля'), 'StrongPassword123!')
}
const recoveryApi = (): RecoveryApi => ({ requestCode: vi.fn().mockResolvedValue(undefined), resetPassword: vi.fn().mockResolvedValue(undefined) })
beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

describe('Вход и сессия', () => {
  it('проверяет email и обязательный пароль до запроса', async () => {
    const { user, api } = setup()
    await user.click(screen.getByRole('button', { name: 'Войти' }))
    expect(await screen.findByText('Введите email')).toBeInTheDocument()
    expect(await screen.findByText('Введите пароль')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Войти' }))
    expect(await screen.findByText('Введите корректный email')).toBeInTheDocument()
    expect(api.login).not.toHaveBeenCalled()
  })

  it.each([
    ['INVALID_CREDENTIALS', 'Неверный email или пароль. Повторите попытку'],
    ['ACCOUNT_DISABLED', 'Ваша учетная запись заблокирована. Обратитесь к администратору'],
    ['NETWORK_ERROR', 'Не удалось связаться с сервером. Проверьте подключение и повторите попытку'],
  ])('показывает ошибку %s без сохранения сессии', async (code, message) => {
    const { user } = setup({ api: { login: vi.fn().mockRejectedValue(new AuthError(code)) } })
    await fillLogin(user)
    await user.click(screen.getByRole('button', { name: 'Войти' }))
    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('блокирует повторную отправку и возвращает полный адрес', async () => {
    let resolve!: (value: AuthSession) => void
    const login = vi.fn(() => new Promise<AuthSession>((done) => { resolve = done }))
    const { user } = setup({ api: { login }, entry: { pathname: '/login', state: { from: { pathname: '/history', search: '?period=week', hash: '#results' } } } })
    await fillLogin(user)
    await user.click(screen.getByRole('button', { name: 'Войти' }))
    expect(screen.getByLabelText('Email')).toBeDisabled()
    expect(screen.getByLabelText('Пароль')).toBeDisabled()
    fireEvent.submit(screen.getByLabelText('Email').closest('form')!)
    await act(async () => { resolve(structuredClone(session)) })
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/history?period=week#results'))
    expect(login).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('accessToken')).toBe('test-token')
    expect(localStorage.getItem('cb-auth-session')).not.toContain('StrongPassword')
  })

  it('проверяет сохранённую сессию через API после перезагрузки', async () => {
    writeSession(session)
    const { api } = setup({ entry: '/profile' })
    expect(await screen.findByText('review@example.com')).toBeInTheDocument()
    expect(api.account).toHaveBeenCalledWith('test-token')
  })

  it('не принимает старую моковую сессию и просроченный токен', async () => {
    localStorage.setItem('cb-session', JSON.stringify({ user: session.user, activeRole: 'ADMIN' }))
    localStorage.setItem('cb-auth-session', JSON.stringify({ ...session, expiresAt: '2000-01-01T00:00:00Z' }))
    localStorage.setItem('accessToken', 'test-token')
    const { api } = setup({ entry: '/profile' })
    expect(await screen.findByRole('heading', { name: 'Войти' })).toBeInTheDocument()
    expect(api.account).not.toHaveBeenCalled()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('cb-session')).toBeNull()
  })

  it('отбрасывает отозванный токен', async () => {
    writeSession(session)
    setup({ api: { account: vi.fn().mockRejectedValue(new AuthError('INVALID_CREDENTIALS')) }, entry: '/profile' })
    expect(await screen.findByRole('heading', { name: 'Войти' })).toBeInTheDocument()
    expect(localStorage.getItem('accessToken')).toBeNull()
  })

  it('разрешает повторить проверку сессии после сетевой ошибки', async () => {
    writeSession(session)
    const account = vi.fn().mockRejectedValueOnce(new AuthError('NETWORK_ERROR')).mockResolvedValue(session.user)
    const { user } = setup({ api: { account }, entry: '/profile' })
    await user.click(await screen.findByRole('button', { name: 'Повторить' }))
    expect(await screen.findByText('review@example.com')).toBeInTheDocument()
    expect(account).toHaveBeenCalledTimes(2)
  })

  it('меняет роль только после ответа API и сохраняет новый токен', async () => {
    writeSession(session)
    const { user, api } = setup({ entry: '/profile' })
    await screen.findByText('review@example.com')
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByTitle('Тренер'))
    expect(await screen.findByRole('link', { name: 'Атлеты' })).toBeInTheDocument()
    expect(api.switchRole).toHaveBeenCalledWith('TRAINER', 'test-token')
    expect(localStorage.getItem('accessToken')).toBe('trainer-token')
    expect(screen.queryByRole('link', { name: 'История' })).not.toBeInTheDocument()
  })
})

describe('Восстановление доступа', () => {
  it('не показывает успешную отправку при ошибке API', async () => {
    const { user } = setup({ recovery: { ...recoveryApi(), requestCode: vi.fn().mockRejectedValue(new AuthError('NETWORK_ERROR')) }, entry: '/forgot-password' })
    await user.type(screen.getByLabelText('Email'), 'review@example.com')
    await user.click(screen.getByRole('button', { name: 'Отправить код' }))
    expect(await screen.findByText('Не удалось связаться с сервером. Проверьте подключение и повторите попытку')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/forgot-password')
  })

  it.each(['known@example.com', 'unknown@example.com'])('показывает одинаковое подтверждение для %s', async (email) => {
    const api = recoveryApi()
    const { user } = setup({ recovery: api, entry: '/forgot-password' })
    await user.type(screen.getByLabelText('Email'), email)
    await user.click(screen.getByRole('button', { name: 'Отправить код' }))
    expect(await screen.findByText('Код восстановления отправлен на указанный email')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/reset-password')
    expect(screen.getByTestId('location')).not.toHaveTextContent(email)
  })

  it('отправляет новый пароль из восьми символов по согласованным требованиям', async () => {
    const api = recoveryApi()
    const { user } = setup({ recovery: api, entry: '/forgot-password' })
    await requestCode(user)
    expect(screen.getByText('От 8 до 30 символов: буквы, цифры и специальный символ')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Код из письма'), '123456')
    await user.type(screen.getByLabelText('Новый пароль'), 'Aa1!aaaa')
    await user.type(screen.getByLabelText('Подтверждение пароля'), 'Aa1!aaaa')
    await user.click(screen.getByRole('button', { name: 'Сменить пароль' }))
    await waitFor(() => expect(api.resetPassword).toHaveBeenCalledWith({ email: 'review@example.com', code: '123456', password: 'Aa1!aaaa', passwordConfirmation: 'Aa1!aaaa' }))
    expect(await screen.findByRole('heading', { name: 'Войти' })).toBeInTheDocument()
  })
  it('проходит восстановление, очищает временные данные и переводит ко входу', async () => {
    const api = recoveryApi()
    const { user } = setup({ recovery: api, entry: '/forgot-password' })
    await requestCode(user)
    await fillReset(user)
    await user.click(screen.getByRole('button', { name: 'Сменить пароль' }))
    expect(await screen.findByText('Пароль успешно изменен. Вы можете войти в систему с новым паролем')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
    expect(api.resetPassword).toHaveBeenCalledWith({ email: 'review@example.com', code: '123456', password: 'StrongPassword123!', passwordConfirmation: 'StrongPassword123!' })
    expect(localStorage.length).toBe(0)
  })

  it.each([
    ['INVALID_CODE', 'Код неверен или больше не действует. Запросите новый код'],
    ['CODE_EXPIRED', 'Срок действия кода истек. Запросите новый код'],
    ['TOO_MANY_ATTEMPTS', 'Превышено количество попыток. Запросите новый код'],
    ['WEAK_PASSWORD', 'Пароль должен содержать от 8 до 30 символов, включая буквы, цифры и специальный символ'],
    ['PASSWORD_MISMATCH', 'Введенные пароли не совпадают'],
  ])('обрабатывает ответ %s', async (code, message) => {
    const api = recoveryApi()
    api.resetPassword = vi.fn().mockRejectedValue(new AuthError(code))
    const { user } = setup({ recovery: api, entry: '/forgot-password' })
    await requestCode(user)
    await fillReset(user)
    await user.click(screen.getByRole('button', { name: 'Сменить пароль' }))
    expect((await screen.findAllByText(message)).length).toBeGreaterThan(0)
    expect(screen.getByTestId('location')).toHaveTextContent('/reset-password')
    if (['CODE_EXPIRED', 'TOO_MANY_ATTEMPTS'].includes(code)) expect(screen.getByRole('button', { name: /Отправить код ещё раз/ })).toHaveClass('!border-red-400')
    if (code === 'INVALID_CODE') expect(screen.getByLabelText('Код из письма')).toHaveAttribute('aria-invalid', 'true')
  })

  it('проверяет ровно шесть цифр и совпадение паролей на клиенте', async () => {
    const api = recoveryApi()
    const { user } = setup({ recovery: api, entry: '/forgot-password' })
    await requestCode(user)
    await user.type(screen.getByLabelText('Код из письма'), '12345x')
    await user.type(screen.getByLabelText('Новый пароль'), 'StrongPassword123!')
    await user.type(screen.getByLabelText('Подтверждение пароля'), 'OtherPassword123!')
    await user.click(screen.getByRole('button', { name: 'Сменить пароль' }))
    expect((await screen.findAllByText('Код должен содержать ровно 6 цифр')).length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Новый пароль')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Подтверждение пароля')).toHaveAttribute('aria-invalid', 'true')
    expect(api.resetPassword).not.toHaveBeenCalled()
  })

  it('блокирует повторную отправку кода до окончания запроса', async () => {
    let resolve!: () => void
    const api = recoveryApi()
    const { user } = setup({ recovery: api, entry: '/forgot-password' })
    await requestCode(user)
    api.requestCode = vi.fn(() => new Promise<void>((done) => { resolve = done }))
    await user.click(screen.getByRole('button', { name: /Отправить код ещё раз/ }))
    expect(screen.getByLabelText('Код из письма')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Отправить код ещё раз/ }))
    expect(api.requestCode).toHaveBeenCalledTimes(1)
    await act(async () => { resolve() })
    expect(await screen.findByText('Код восстановления отправлен на указанный email')).toBeInTheDocument()
  })

  it('возвращает к email без передачи кода или пароля в URL', async () => {
    const { user } = setup({ recovery: recoveryApi(), entry: '/forgot-password' })
    await requestCode(user)
    await fillReset(user)
    await user.click(screen.getByRole('button', { name: 'Вернуться к вводу email' }))
    expect(screen.getByLabelText('Email')).toHaveValue('review@example.com')
    expect(screen.getByTestId('location')).toHaveTextContent('/forgot-password')
    expect(localStorage.length).toBe(0)
  })

  it('без временного email возвращает к первому шагу', async () => {
    setup({ entry: '/reset-password' })
    expect(await screen.findByRole('heading', { name: 'Восстановление пароля' })).toBeInTheDocument()
  })
})

it.each(['UNAUTHORIZED', 'UNKNOWN_AUTH_ERROR'])('при восстановлении сессии с HTTP 401 %s выходит на логин', async (code) => {
  writeSession(session)
  const { client } = setup({ api: { account: vi.fn().mockRejectedValue(new AuthError(code, 401)) }, entry: '/profile' })
  expect(await screen.findByRole('heading', { name: 'Войти' })).toBeInTheDocument()
  expect(localStorage.getItem('accessToken')).toBeNull()
  expect(localStorage.getItem('cb-auth-session')).toBeNull()
  expect(client.getQueryData(['profile', session.user.id])).toBeUndefined()
})

it.each(['UNAUTHORIZED', 'UNKNOWN_AUTH_ERROR'])('при смене роли с HTTP 401 %s выходит на логин', async (code) => {
  writeSession(session)
  const { user } = setup({ api: { switchRole: vi.fn().mockRejectedValue(new AuthError(code, 401)) }, entry: '/profile' })
  await user.click(await screen.findByRole('combobox', { name: 'Активная роль' }))
  await user.click(await screen.findByTitle('Тренер'))
  expect(await screen.findByRole('heading', { name: 'Войти' })).toBeInTheDocument()
  expect(localStorage.getItem('accessToken')).toBeNull()
  expect(localStorage.getItem('cb-auth-session')).toBeNull()
})
