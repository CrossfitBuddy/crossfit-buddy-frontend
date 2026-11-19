import { api } from '../../api/http'
import { mapOwnWorkoutResponseToDraft, ownWorkoutResponseSchema } from './ownWorkoutResponse'
import type { WorkoutDraft } from './workoutDraft'

export type FetchOwnWorkoutApi = {
  fetchOwnWorkout: (id: string, signal?: AbortSignal) => Promise<WorkoutDraft>
}

export const fetchOwnWorkoutApi: FetchOwnWorkoutApi = {
  async fetchOwnWorkout(id, signal) {
    const { data } = await api.get<unknown>(`/v1/workouts/${encodeURIComponent(id)}`, { signal })
    const parsed = ownWorkoutResponseSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error('Сервер вернул некорректную тренировку для редактирования')
    }
    return mapOwnWorkoutResponseToDraft(parsed.data)
  },
}