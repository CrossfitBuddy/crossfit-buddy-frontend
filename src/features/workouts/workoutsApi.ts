import type { UserRole } from '../../app/auth/types'

export const sources = { own: 'Своя', assigned: 'От тренера', shared: 'Общая' }
export const statuses = { planned: 'Запланирована', completed: 'Завершена' }

export type Workout = {
  id: string
  title: string
  format: string
  startsAt: string
  status: keyof typeof statuses
  source: keyof typeof sources
}

const demoWorkouts: Workout[] = [
  { id: 'demo-fran', title: 'Fran', format: 'For Time', startsAt: '2026-11-12T18:00:00', status: 'planned', source: 'own' },
  { id: 'demo-cindy', title: 'Cindy', format: 'AMRAP', startsAt: '2026-11-14T10:30:00', status: 'planned', source: 'assigned' },
  { id: 'demo-intervals', title: 'Интервалы', format: 'EMOM', startsAt: '2026-11-08T12:00:00', status: 'completed', source: 'shared' },
]

export const workoutsApi = {
  async list(role: UserRole): Promise<Workout[]> {
    if (role === 'ATHLETE') return demoWorkouts
    if (role === 'TRAINER') return demoWorkouts.filter(({ source }) => source !== 'assigned')
    return []
  },
  async get(id: string, role: UserRole): Promise<Workout | null> {
    return (await workoutsApi.list(role)).find((workout) => workout.id === id) ?? null
  },
}