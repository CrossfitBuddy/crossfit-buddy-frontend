import { api } from './http'

export type UserRole = 'ATHLETE' | 'TRAINER'

export type RegisterRequest = {
  email: string
  password: string
  displayName: string
  role: UserRole
}

export async function registerUser(request: RegisterRequest): Promise<void> {
  await api.post('/api/v1/auth/register', request)
}
