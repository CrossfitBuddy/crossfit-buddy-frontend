import { Dumbbell, History, House, Layers, ListChecks, UserRound, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { DashboardPage } from '../pages/DashboardPage'
import { ExerciseCatalog } from '../features/exercises/ExerciseCatalog'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { ProfilePage } from '../pages/ProfilePage'
import type { UserRole } from './auth/types'

export type AppRoute = {
  path: string
  title: string
  roles: UserRole[]
  element: ReactNode
  icon?: LucideIcon
}

const allRoles: UserRole[] = ['ATHLETE', 'TRAINER', 'ADMIN']

export const appRoutes: AppRoute[] = [
  { path: '/', title: 'Главная', roles: allRoles, element: <DashboardPage />, icon: House },
  { path: '/workouts', title: 'Тренировки', roles: ['ATHLETE', 'TRAINER'], element: <PlaceholderPage title="Тренировки" />, icon: Dumbbell },
  { path: '/history', title: 'История', roles: ['ATHLETE'], element: <PlaceholderPage title="История" />, icon: History },
  { path: '/athletes', title: 'Атлеты', roles: ['TRAINER'], element: <PlaceholderPage title="Атлеты" />, icon: Users },
  { path: '/exercises', title: 'Упражнения', roles: allRoles, element: <ExerciseCatalog />, icon: ListChecks },
  { path: '/formats', title: 'Форматы', roles: ['ADMIN'], element: <PlaceholderPage title="Форматы" />, icon: Layers },
  { path: '/profile', title: 'Профиль', roles: allRoles, element: <ProfilePage />, icon: UserRound },
]

export const getMenuItems = (role: UserRole) =>
  appRoutes.filter((route) => route.icon && route.roles.includes(role))
