import { z } from 'zod'
import { api } from '../../../api/http'
import { getApiErrorStatus } from '../../../api/session'
import type { WorkoutCardApi, WorkoutDetails, WorkoutErrorKind } from './types'

const optionalNumber = z.number().nullish().transform((value) => value ?? null)
const optionalText = z.string().nullish().transform((value) => value ?? null)

const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number().int(),
  repetitions: optionalNumber,
  weightKg: optionalNumber,
  durationSeconds: optionalNumber,
  distanceMeters: optionalNumber,
  heightCm: optionalNumber,
  notes: optionalText,
})

const roundSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  repeatCount: z.number().int(),
  exercises: z.array(exerciseSchema).default([]),
})

const stageSchema = z.object({
  id: z.string(),
  format: z.string(),
  complexFormat: z.string(),
  timeLimitSeconds: optionalNumber,
  targetRounds: optionalNumber,
  intervalSeconds: optionalNumber,
  rounds: z.array(roundSchema).default([]),
})

const materialSchema = z.object({
  type: z.string(),
  title: z.string(),
  url: z.string(),
})

const workoutSchema = z.object({
  id: z.string(),
  title: optionalText,
  description: optionalText,
  durationSec: optionalNumber,
  stages: z.array(stageSchema).default([]),
  materials: z.array(materialSchema).nullish().transform((materials) => materials ?? []),
})

export function parseWorkout(data: unknown): WorkoutDetails {
  const result = workoutSchema.safeParse(data)
  if (!result.success) throw new Error('Сервер вернул некорректную карточку тренировки')
  const { durationSec, stages, ...workout } = result.data
  return {
    ...workout,
    title: workout.title?.trim() || 'Тренировка без названия',
    durationSeconds: durationSec,
    stages: stages.map(({ rounds, ...stage }) => ({
      ...stage,
      rounds: rounds.map((round) => ({
        ...round,
        exercises: [...round.exercises].sort((left, right) => left.position - right.position),
      })).sort((left, right) => left.position - right.position),
    })),
  }
}

export function getWorkoutErrorKind(error: unknown): WorkoutErrorKind {
  const status = getApiErrorStatus(error)
  if (status === 400) return 'invalid-id'
  if (status === 401) return 'unauthorized'
  if (status === 404) return 'not-found'
  if (status === 403) return 'forbidden'
  return 'unknown'
}

export const workoutCardApi: WorkoutCardApi = {
  async getWorkout(id, signal) {
    const { data } = await api.get<unknown>(`/v1/workouts/${encodeURIComponent(id)}`, { signal })
    return parseWorkout(data)
  },
}
