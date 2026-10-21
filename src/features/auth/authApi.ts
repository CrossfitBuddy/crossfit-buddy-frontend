import axios from 'axios'
import type { AuthSession, User, UserRole } from '../../app/auth/types'

export class AuthError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.name = 'AuthError'
    this.code = code
  }
}

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '', timeout: 15000 })

export function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false
  const user = value as Partial<User>
  const roles: string[] = ['ATHLETE', 'TRAINER', 'ADMIN']
  return typeof user.id === 'string' && typeof user.email === 'string'
    && typeof user.displayName === 'string' && Array.isArray(user.roles) && user.roles.length > 0
    && user.roles.every((role) => roles.includes(role))
    && typeof user.activeRole === 'string' && user.roles.includes(user.activeRole)
    && (!user.roles.includes('ADMIN') || user.activeRole === 'ADMIN')
}

export function isSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false
  const session = value as Partial<AuthSession>
  return typeof session.accessToken === 'string' && session.accessToken.length > 0
    && session.tokenType === 'Bearer' && typeof session.expiresAt === 'string'
    && Date.parse(session.expiresAt) > Date.now() && isUser(session.user)
}

function sanitizedError(error: unknown): AuthError {
  if (axios.isAxiosError(error)) {
    const code: unknown = error.response?.data?.code
    if (typeof code === 'string') return new AuthError(code)
    if (error.response?.status === 401) return new AuthError('INVALID_CREDENTIALS')
    if (error.response?.status === 429) return new AuthError('TOO_MANY_REQUESTS')
    return new AuthError(error.response ? 'SERVER_ERROR' : 'NETWORK_ERROR')
  }
  return error instanceof AuthError ? error : new AuthError('SERVER_ERROR')
}

async function request<T>(operation: () => Promise<{ data: T }>): Promise<T> {
  try { return (await operation()).data } catch (error) { throw sanitizedError(error) }
}

function sessionResponse(value: unknown) {
  if (!isSession(value)) throw new AuthError('INVALID_RESPONSE')
  return value
}

export const authApi = {
  async login(email: string, password: string) {
    return sessionResponse(await request(() => http.post('/api/v1/auth/login', { email: email.trim(), password })))
  },
  async account(accessToken: string) {
    const user = await request<unknown>(() => http.get('/api/v1/auth/me', { headers: { Authorization: 'Bearer ' + accessToken } }))
    if (!isUser(user)) throw new AuthError('INVALID_RESPONSE')
    return user
  },
  async switchRole(role: UserRole, accessToken: string) {
    return sessionResponse(await request(() => http.patch('/api/v1/auth/active-role', { role }, { headers: { Authorization: 'Bearer ' + accessToken } })))
  },
}

export type AuthApi = typeof authApi

export function authErrorMessage(error: unknown): string {
  const code = error instanceof AuthError ? error.code : ''
  const messages: Record<string, string> = {
    INVALID_CREDENTIALS: 'Неверный email или пароль. Повторите попытку',
    ACCOUNT_DISABLED: 'Ваша учетная запись заблокирована. Обратитесь к администратору',
    ROLE_NOT_ASSIGNED: 'Роль не назначена. Обратитесь к администратору',
    ACCESS_DENIED: 'Эта роль недоступна для вашего аккаунта',
    PASSWORD_TOO_LONG: 'Пароль слишком длинный',
    TOO_MANY_REQUESTS: 'Слишком много запросов. Попробуйте позже',
    NETWORK_ERROR: 'Не удалось связаться с сервером. Проверьте подключение и повторите попытку',
    INVALID_RESPONSE: 'Сервер вернул некорректные данные. Попробуйте позже',
    STORAGE_ERROR: 'Не удалось сохранить сессию. Разрешите хранение данных сайта и повторите вход',
    RECOVERY_UNAVAILABLE: 'Восстановление пароля пока недоступно. Попробуйте позже',
    INVALID_CODE: 'Неверный код восстановления',
    CODE_EXPIRED: 'Срок действия кода истек. Запросите новый код',
    TOO_MANY_ATTEMPTS: 'Превышено количество попыток. Запросите новый код',
    PASSWORD_MISMATCH: 'Введенные пароли не совпадают',
    WEAK_PASSWORD: 'Пароль должен содержать от 14 до 30 символов, включая буквы, цифры и специальный символ',
  }
  return messages[code] ?? 'Не удалось выполнить запрос. Попробуйте ещё раз'
}
