import { isAxiosError } from 'axios'
import { z } from 'zod'
import { api } from '../../api/http'
import { CreateWorkoutError, type WorkoutErrorBody } from './createWorkoutTypes'
import type { OwnWorkoutRequest } from './ownWorkoutTypes'

const updatedWorkoutSchema = z.object({
  id: z.uuid(),
})

const fieldErrorSchema = z.object({
  field: z.string(),
  code: z.string(),
  message: z.string(),
})

export type UpdateOwnWorkoutApi = {
  updateOwnWorkout: (id: string, request: OwnWorkoutRequest, signal?: AbortSignal) => Promise<{ id: string }>
}

function parseFieldErrors(data: unknown): CreateWorkoutError['fieldErrors'] {
  const body = data as WorkoutErrorBody | undefined
  if (!body?.fieldErrors?.length) return []
  return body.fieldErrors.flatMap((entry) => {
    const parsed = fieldErrorSchema.safeParse(entry)
    return parsed.success ? [parsed.data] : []
  })
}

function throwFromAxios(error: unknown): never {
  if (!isAxiosError<WorkoutErrorBody>(error) || !error.response) {
    if (error instanceof Error) throw error
    throw new CreateWorkoutError(0, 'Не удалось сохранить тренировку.')
  }
  const { status, data } = error.response
  const fieldErrors = parseFieldErrors(data)
  const message = data?.message ?? 'Не удалось сохранить тренировку.'
  throw new CreateWorkoutError(status, message, data?.code, fieldErrors)
}

export const updateOwnWorkoutApi: UpdateOwnWorkoutApi = {
  async updateOwnWorkout(id, request, signal) {
    try {
      const { data } = await api.put<unknown>(`/v1/workouts/${encodeURIComponent(id)}`, request, { signal })
      const parsed = updatedWorkoutSchema.safeParse(data)
      if (!parsed.success) {
        return { id }
      }
      return parsed.data
    } catch (error) {
      if (error instanceof CreateWorkoutError || (error instanceof Error && error.message.startsWith('Сервер вернул'))) {
        throw error
      }
      throwFromAxios(error)
    }
  },
}