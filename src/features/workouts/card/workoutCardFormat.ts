import type { WorkoutExercise, WorkoutStage } from './types'

export function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatDuration(totalSeconds: number) {
  return totalSeconds % 60 === 0 ? `${totalSeconds / 60} мин` : formatClock(totalSeconds)
}

export function exerciseParams(exercise: WorkoutExercise) {
  return [
    exercise.repetitions !== null && `${exercise.repetitions} повт.`,
    exercise.weightKg !== null && `${exercise.weightKg} кг`,
    exercise.durationSeconds !== null && formatClock(exercise.durationSeconds),
    exercise.distanceMeters !== null && `${exercise.distanceMeters} м`,
    exercise.heightCm !== null && `высота ${exercise.heightCm} см`,
  ].filter((value): value is string => value !== false)
}

export function stageParams(stage: WorkoutStage) {
  return [
    stage.timeLimitSeconds !== null && `Время: ${formatClock(stage.timeLimitSeconds)}`,
    stage.targetRounds !== null && `Раундов: ${stage.targetRounds}`,
    stage.intervalSeconds !== null && `Интервал: ${formatClock(stage.intervalSeconds)}`,
  ].filter((value): value is string => value !== false)
}

export function isSafeUrl(value: string) {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
