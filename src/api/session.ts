import { isAxiosError } from 'axios'
import type { UserRole } from '../app/auth/types'
import { api } from './http'

export type AccountResponse = {
  id: string
  email: string
  displayName: string
  roles: UserRole[]
  activeRole: UserRole
}

export type AuthResponse = {
  accessToken: string
  tokenType: string
  expiresAt: string
  user: AccountResponse
}

type ApiErrorBody = {
  code?: string
  message?: string
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/v1/auth/login', { email, password })
  return data
}

export async function switchActiveRole(role: UserRole, accessToken?: string): Promise<AuthResponse> {
  const { data } = await api.patch<AuthResponse>('/api/v1/auth/active-role', { role }, accessToken ? { headers: { Authorization: 'Bearer ' + accessToken } } : undefined)
  return data
}

export function getApiErrorCode(error: unknown): string | undefined {
  return isAxiosError<ApiErrorBody>(error) ? error.response?.data?.code : undefined
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined
}

export async function getAccount(accessToken: string): Promise<AccountResponse> {
  const { data } = await api.get<AccountResponse>('/api/v1/auth/me', { headers: { Authorization: 'Bearer ' + accessToken } })
  return data
}
