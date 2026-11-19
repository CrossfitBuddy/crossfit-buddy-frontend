import { Dumbbell, History, House, Layers, ListChecks, UserRound, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ExerciseCatalog } from '../features/exercises/ExerciseCatalog'
import { RoundRoute } from '../features/exercises/RoundRoute'
import { DashboardPage } from '../pages/DashboardPage'
import { ExerciseEditorPage } from '../pages/ExerciseEditorPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { WorkoutCreatePage } from '../pages/WorkoutCreatePage'
import { WorkoutsPage } from '../pages/WorkoutsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { useAuth } from './auth/useAuth'
import type { UserRole } from './auth/types'

export type AppRoute = {
  path: string
  title: string
  roles: UserRole[]
  element: ReactNode
  icon?: LucideIcon
}

const allRoles: UserRole[] = ['ATHLETE', 'TRAINER', 'ADMIN']

function ExercisesEntry() {
  const { activeRole } = useAuth()
  if (activeRole === 'ADMIN') return <PlaceholderPage title="Упражнения" />
  return <ExerciseCatalog />
}

function WorkoutsEntry() {
  const { activeRole } = useAuth()
  if (activeRole === 'TRAINER') return <WorkoutsPage />
  return <PlaceholderPage title="Тренировки" />
}

export const appRoutes: AppRoute[] = [
  { path: '/', title: 'Главная', roles: allRoles, element: <DashboardPage />, icon: House },
  { path: '/workouts', title: 'Тренировки', roles: ['ATHLETE', 'TRAINER'], element: <WorkoutsEntry />, icon: Dumbbell },
  { path: '/workouts/new', title: 'Новая тренировка', roles: ['TRAINER'], element: <WorkoutCreatePage /> },
  { path: '/history', title: 'История', roles: ['ATHLETE'], element: <PlaceholderPage title="История" />, icon: History },
  { path: '/athletes', title: 'Атлеты', roles: ['TRAINER'], element: <PlaceholderPage title="Атлеты" />, icon: Users },
  { path: '/exercises', title: 'Упражнения', roles: allRoles, element: <ExercisesEntry />, icon: ListChecks },
  { path: '/exercises/new', title: 'Новое упражнение', roles: ['ADMIN'], element: <ExerciseEditorPage /> },
  { path: '/exercises/:id/edit', title: 'Редактирование упражнения', roles: ['ADMIN'], element: <ExerciseEditorPage /> },
  { path: '/round', title: 'Раунд', roles: ['ATHLETE', 'TRAINER'], element: <RoundRoute /> },
  { path: '/formats', title: 'Форматы', roles: ['ADMIN'], element: <PlaceholderPage title="Форматы" />, icon: Layers },
  { path: '/profile', title: 'Профиль', roles: allRoles, element: <ProfilePage />, icon: UserRound },
]

export const getMenuItems = (role: UserRole) =>
  appRoutes.filter((route) => route.icon && route.roles.includes(role))
