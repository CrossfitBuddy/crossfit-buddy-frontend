import { beforeEach, describe, expect, it, vi } from 'vitest'
const transport = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), patch: vi.fn() }))
vi.mock('../../api/http', () => ({ api: transport }))
import { AuthError, authApi, isSession } from './authApi'
import { isStrongPassword, returnAddress } from './validation'

const response = {
  accessToken: 'test-token', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z',
  user: { id: 'account-1', email: 'review@example.com', displayName: 'Иван', roles: ['TRAINER'], activeRole: 'TRAINER' },
}
beforeEach(() => vi.resetAllMocks())

describe('Контракт входа', () => {
  it('отправляет пароль в теле, очищает пробелы только у email', async () => {
    transport.post.mockResolvedValue({ data: response })
    await expect(authApi.login(' review@example.com ', ' Password123! ')).resolves.toEqual(response)
    expect(transport.post).toHaveBeenCalledWith('/api/v1/auth/login', { email: 'review@example.com', password: ' Password123! ' })
  })
  it('не возвращает наружу Axios-ошибку с секретами запроса', async () => {
    transport.post.mockRejectedValue({ isAxiosError: true, response: { status: 401, data: { code: 'INVALID_CREDENTIALS' } }, config: { data: { password: 'secret-password' } } })
    let caught: unknown
    try { await authApi.login('review@example.com', 'secret-password') } catch (error) { caught = error }
    expect(caught).toBeInstanceOf(AuthError)
    expect(String(caught)).not.toContain('secret-password')
    expect(JSON.stringify(caught)).not.toContain('secret-password')
  })
  it('не принимает ответ без токена или с невыданной ролью', async () => {
    transport.post.mockResolvedValue({ data: { ...response, accessToken: '' } })
    await expect(authApi.login('review@example.com', 'password')).rejects.toThrow('INVALID_RESPONSE')
    expect(isSession({ ...response, user: { ...response.user, activeRole: 'ADMIN' } })).toBe(false)
  })
  it('при смене роли передаёт действующий токен в заголовке', async () => {
    transport.patch.mockResolvedValue({ data: response })
    await authApi.switchRole('TRAINER', 'old-token')
    expect(transport.patch).toHaveBeenCalledWith('/api/v1/auth/active-role', { role: 'TRAINER' }, { headers: { Authorization: 'Bearer old-token' } })
  })
})
describe('Клиентские проверки', () => {
  it.each(['Aa1!aaa', 'A1!' + 'a'.repeat(28), '12345678901234', 'OnlyLettersHere', 'Password123', 'Password123 '])('отклоняет слабый пароль %s', (password) => {
    expect(isStrongPassword(password)).toBe(false)
  })
  it.each(['Aa1!aaaa', 'A1!' + 'a'.repeat(27), 'StrongPassword123!'])('принимает пароль с обязательными символами длиной %s', (password) => expect(isStrongPassword(password)).toBe(true))
  it('сохраняет параметры и якорь, отклоняет внешние адреса', () => {
    expect(returnAddress({ pathname: '/history', search: '?period=week', hash: '#results' })).toBe('/history?period=week#results')
    expect(returnAddress({ pathname: '//example.com' })).toBe('/')
    expect(returnAddress({ pathname: '/login' })).toBe('/')
  })
})

it.each(['UNAUTHORIZED', 'UNKNOWN_AUTH_ERROR'])('сохраняет HTTP 401 с кодом %s для выхода из сессии', async (code) => {
  const error = { isAxiosError: true, response: { status: 401, data: { code } } }
  transport.get.mockRejectedValue(error)
  transport.patch.mockRejectedValue(error)
  await expect(authApi.account('invalid-token')).rejects.toMatchObject({ status: 401, code })
  await expect(authApi.switchRole('TRAINER', 'invalid-token')).rejects.toMatchObject({ status: 401, code })
})
