import { beforeEach, expect, it } from 'vitest'
import { api } from './http'

beforeEach(() => { localStorage.clear(); localStorage.setItem('accessToken', 'revoked-token') })

async function authorizationFor(url: string) {
  const response = await api.request({ url, adapter: async (config) => ({
    data: null, status: 200, statusText: 'OK', headers: {}, config,
  }) })
  return response.config.headers.Authorization
}

it.each([
  '/api/v1/auth/login', '/api/v1/auth/register',
  '/api/v1/auth/password/request', '/api/v1/auth/password/confirm',
  '/api/v1/auth/email/confirm', '/api/v1/auth/email/resend',
])('не отправляет отозванный токен на публичный адрес %s', async (path) => {
  expect(await authorizationFor(path)).toBeUndefined()
})

it.each(['/api/v1/auth/me', '/api/v1/auth/active-role'])('сохраняет авторизацию для %s', async (path) => {
  expect(await authorizationFor(path)).toBe('Bearer revoked-token')
})
