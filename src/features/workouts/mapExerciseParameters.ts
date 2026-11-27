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

const REQUEST_TO_METRIC: Partial<Record<keyof WorkoutExerciseRequest, string>> = {
  repetitions: 'repetitions',
  weightKg: 'weightKg',
  durationSeconds: 'durationSeconds',
  distanceMeters: 'distance',
}

/** Поля ответа API → параметры раунда (#19079). */
export function unmapExerciseParameters(
  request: Partial<WorkoutExerciseRequest>,
): Record<string, number> | undefined {
  const parameters: Record<string, number> = {}
  for (const [field, metric] of Object.entries(REQUEST_TO_METRIC) as [keyof WorkoutExerciseRequest, string][]) {
    const value = request[field]
    if (typeof value === 'number' && Number.isFinite(value)) parameters[metric] = value
  }
  return Object.keys(parameters).length > 0 ? parameters : undefined
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