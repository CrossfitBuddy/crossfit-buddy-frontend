import { beforeEach, expect, it, vi } from 'vitest'
import { recoveryApi } from './recoveryApi'
import { AuthError } from './authApi'
const transport = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('../../api/http', () => ({ api: transport }))
beforeEach(() => vi.resetAllMocks())

it('передаёт email и секреты только в теле запросов восстановления', async () => {
  transport.post.mockResolvedValue({ data: { message: 'ok' } })
  await recoveryApi.requestCode(' review@example.com ')
  expect(transport.post).toHaveBeenCalledWith('/api/v1/auth/password/request', { email: 'review@example.com' })
  const values = { email: 'review@example.com', code: '123456', password: 'Password123!', passwordConfirmation: 'Password123!' }
  await recoveryApi.resetPassword(values)
  expect(transport.post).toHaveBeenLastCalledWith('/api/v1/auth/password/confirm', values)
})

it.each([
  ['INVALID_RESET_CODE', 'INVALID_CODE'],
  ['RESET_CODE_EXPIRED', 'CODE_EXPIRED'],
  ['RESET_ATTEMPTS_EXCEEDED', 'TOO_MANY_ATTEMPTS'],
  ['PASSWORD_MISMATCH', 'PASSWORD_MISMATCH'],
  ['PASSWORD_TOO_LONG', 'PASSWORD_TOO_LONG'],
  ['VALIDATION_ERROR', 'VALIDATION_ERROR'],
])('обрабатывает код бэка %s без секретов в ошибке', async (code, expected) => {
  transport.post.mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { code } }, config: { data: 'secret-password' } })
  let caught: unknown
  try { await recoveryApi.requestCode('review@example.com') } catch (error) { caught = error }
  expect(caught).toBeInstanceOf(AuthError)
  expect(caught).toHaveProperty('code', expected)
  expect(JSON.stringify(caught)).not.toContain('secret-password')
})

it.each([[429, 'TOO_MANY_REQUESTS'], [500, 'SERVER_ERROR'], [undefined, 'NETWORK_ERROR']])('обрабатывает HTTP %s', async (status, expected) => {
  transport.post.mockRejectedValue({ isAxiosError: true, response: status ? { status } : undefined })
  await expect(recoveryApi.requestCode('review@example.com')).rejects.toThrow(expected)
})
