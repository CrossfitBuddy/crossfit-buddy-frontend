export type UserRole = 'ATHLETE' | 'TRAINER' | 'ADMIN'

export type User = {
  id: string
  email: string
  displayName: string
  roles: UserRole[]
}
