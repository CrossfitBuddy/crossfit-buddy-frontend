export type UserRole = 'ATHLETE' | 'TRAINER' | 'ADMIN'

export type User = {
  id: string
  email: string
  displayName: string
  roles: UserRole[]
  activeRole: UserRole
}

export type AuthSession = {
  accessToken: string
  tokenType: 'Bearer'
  expiresAt: string
  user: User
}
