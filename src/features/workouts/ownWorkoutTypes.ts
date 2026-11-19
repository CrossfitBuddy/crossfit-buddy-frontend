/** Типы запроса создания своей тренировки (контракт CB-18978, PR #25 backend). */

import type { FormatType } from '../formats/types'

export type WorkoutFormatType = FormatType

export type OwnWorkoutRequest = {
  name?: string | null
  description?: string | null
  datetime: string
  durationSeconds?: number | null
  stages: WorkoutStageRequest[]
}

export type WorkoutStageRequest = {
  workoutStageId: number
  format: WorkoutFormatType
  timeLimitSeconds?: number
  intervalSeconds?: number
  targetRounds?: number
  rounds: WorkoutRoundRequest[]
}

export type WorkoutRoundRequest = {
  repeatCount: number
  exercises: WorkoutExerciseRequest[]
}

export type WorkoutExerciseRequest = {
  exerciseId: string
  repetitions?: number
  weightKg?: number
  distanceMeters?: number
  durationSeconds?: number
}