/** Типы запроса создания своей тренировки (контракт CB-18978, PR #25 backend). */

export type WorkoutFormatType = 'AMRAP' | 'FOR_TIME' | 'EMOM' | 'TABATA'

export type OwnWorkoutRequest = {
  name?: string | null
  description?: string | null
  datetime: string
  durationMinutes?: number | null
  stages: WorkoutStageRequest[]
}

export type WorkoutStageRequest = {
  stageFormatId: number
  format: WorkoutFormatType
  params: Record<string, number>
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
  durationMinutes?: number
}