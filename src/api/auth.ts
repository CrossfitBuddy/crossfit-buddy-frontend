import { api } from './http'

export type UserRole = 'ATHLETE' | 'TRAINER'

export type RegisterRequest = {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirmation: string
  role: UserRole
}

export async function registerUser(request: RegisterRequest): Promise<void> {
  await api.post('/api/v1/auth/register', request)
}

export async function confirmEmail(token: string): Promise<void> {
  await api.post('/api/v1/auth/email/confirm', { token })
}

export async function resendConfirmationEmail(email: string): Promise<void> {
  await api.post('/api/v1/auth/email/resend', { email })
}
