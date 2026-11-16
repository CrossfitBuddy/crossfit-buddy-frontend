import { isAxiosError } from 'axios'
import { z } from 'zod'
import { api } from '../../../api/http'
import type { WorkoutCardApi, WorkoutDetails, WorkoutErrorKind } from './types'

const optionalNumber = z.number().nullish().transform((value) => value ?? null)
const optionalText = z.string().nullish().transform((value) => value ?? null)

const exerciseSchema = z.object({
  exerciseId: z.string(),
  name: z.string(),
  repetitions: optionalNumber,
  weightKg: optionalNumber,
  durationSeconds: optionalNumber,
  distanceMeters: optionalNumber,
  heightCm: optionalNumber,
  notes: optionalText,
})

const roundSchema = z.object({
  position: z.number(),
  repeatCount: z.number().default(1),
  exercises: z.array(exerciseSchema).default([]),
})

const stageSchema = z.object({
  id: z.string(),
  name: z.string(),
  format: z.object({ name: z.string() }),
  timeLimitSeconds: optionalNumber,
  targetRounds: optionalNumber,
  intervalSeconds: optionalNumber,
  rounds: z.array(roundSchema).default([]),
})

const materialSchema = z.object({
  type: z.enum(['VIDEO', 'LINK', 'FILE']),
  title: z.string(),
  url: z.string(),
})

const workoutSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: optionalText,
  startsAt: optionalText,
  durationSeconds: optionalNumber,
  stages: z.array(stageSchema).default([]),
  materials: z.array(materialSchema).default([]),
})

export function parseWorkout(data: unknown): WorkoutDetails {
  const result = workoutSchema.safeParse(data)
  if (!result.success) throw new Error('Сервер вернул некорректную карточку тренировки')
  const { stages, ...workout } = result.data
  return {
    ...workout,
    stages: stages.map(({ format, rounds, ...stage }) => ({
      ...stage,
      formatName: format.name,
      rounds: [...rounds].sort((left, right) => left.position - right.position),
    })),
  }
}

export function getWorkoutErrorKind(error: unknown): WorkoutErrorKind {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 404) return 'not-found'
  if (status === 403) return 'forbidden'
  return 'unknown'
}

export const workoutCardApi: WorkoutCardApi = {
  async getWorkout(id, signal) {
    const { data } = await api.get<unknown>(`/api/v1/workouts/${encodeURIComponent(id)}`, { signal })
    return parseWorkout(data)
  },
}
