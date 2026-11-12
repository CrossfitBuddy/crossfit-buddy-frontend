import { beforeEach, expect, it } from 'vitest'
import { api } from './http'

it('берёт базовый адрес /api, чтобы путь /v1 не обходил контекст бэкенда', () => {
  expect(api.defaults.baseURL).toBe('/api')
})

beforeEach(() => { localStorage.clear(); localStorage.setItem('accessToken', 'revoked-token') })

async function authorizationFor(url: string) {
  const response = await api.request({ url, adapter: async (config) => ({
    data: null, status: 200, statusText: 'OK', headers: {}, config,
  }) })
  return response.config.headers.Authorization
}

it.each([
  '/v1/auth/login', '/v1/auth/register',
  '/v1/auth/password/request', '/v1/auth/password/confirm',
  '/v1/auth/email/confirm', '/v1/auth/email/resend',
])('не отправляет отозванный токен на публичный адрес %s', async (path) => {
  expect(await authorizationFor(path)).toBeUndefined()
})

it.each(['/v1/auth/me', '/v1/auth/active-role'])('сохраняет авторизацию для %s', async (path) => {
  expect(await authorizationFor(path)).toBe('Bearer revoked-token')
})
