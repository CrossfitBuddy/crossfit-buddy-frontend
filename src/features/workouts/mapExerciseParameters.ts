import type { WorkoutExerciseRequest } from './ownWorkoutTypes'

const METRIC_TO_REQUEST: Record<string, keyof WorkoutExerciseRequest> = {
  repetitions: 'repetitions',
  weightKg: 'weightKg',
  weight: 'weightKg',
  duration: 'durationSeconds',
  durationSeconds: 'durationSeconds',
  distance: 'distanceMeters',
  distanceMeters: 'distanceMeters',
}

/** Параметры из раунда (#19079) → поля WorkoutExerciseRequest. */
export function mapExerciseParameters(parameters?: Record<string, number>): Partial<WorkoutExerciseRequest> {
  if (!parameters) return {}
  const result: Partial<WorkoutExerciseRequest> = {}
  for (const [key, value] of Object.entries(parameters)) {
    if (!Number.isFinite(value)) continue
    const field = METRIC_TO_REQUEST[key]
    if (!field) continue
    ;(result as Record<string, number>)[field] = value
  }
  return result
}