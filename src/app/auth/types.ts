export type UserRole = 'ATHLETE' | 'TRAINER' | 'ADMIN'

export type User = {
  email: string
  firstName: string
  lastName: string
  roles: UserRole[]
}
