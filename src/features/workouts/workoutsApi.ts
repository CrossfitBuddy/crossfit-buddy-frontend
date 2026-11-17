import { z } from 'zod'
import { api } from '../../api/http'

export const sources = { OWN: 'Своя', ASSIGNED: 'От тренера', SHARED: 'Общая' }
export const statuses = {
  DRAFT: 'Черновик',
  READY: 'Готова',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
}

const workoutSchema = z.object({
  id: z.uuid(),
  title: z.string().nullish(),
  date: z.iso.datetime({ offset: true }),
  status: z.enum(['DRAFT', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  source: z.enum(['OWN', 'ASSIGNED', 'SHARED']),
})

const workoutPageSchema = z.object({
  items: z.array(workoutSchema),
  page: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export type Workout = z.infer<typeof workoutSchema>

export type WorkoutFilters = {
  q: string
  source: Workout['source'] | ''
  status: Workout['status'] | ''
  date: string
  page: number
}

export const workoutsApi = {
  async list({ q, source, status, date, page }: WorkoutFilters, signal?: AbortSignal) {
    const { data } = await api.get('/v1/workouts', {
      params: {
        q: q || undefined,
        source: source || undefined,
        status: status || undefined,
        dateFrom: date || undefined,
        dateTo: date || undefined,
        page,
      },
      signal,
    })
    return workoutPageSchema.parse(data)
  },
}
