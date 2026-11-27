import type { WorkoutFieldError } from './createWorkoutTypes'

const FIELD_LABELS: Record<string, string> = {
  name: 'Название',
  description: 'Описание',
  datetime: 'Дата и время',
  durationSeconds: 'Длительность',
}

export function labelWorkoutField(path: string): string {
  if (FIELD_LABELS[path]) return FIELD_LABELS[path]
  const stage = path.match(/^stages\[(\d+)\]/)
  if (stage) {
    const index = Number(stage[1])
    const titles = ['Разминка', 'Сила и навык', 'WOD', 'Заминка']
    const base = titles[index] ?? `Этап ${index + 1}`
    if (path.includes('timeLimitSeconds')) return `${base}: длительность`
    if (path.includes('intervalSeconds')) return `${base}: интервал`
    if (path.includes('targetRounds')) return `${base}: раунды`
    if (path.includes('.params.')) {
      const param = path.split('.params.')[1]?.split(']')[0]
      if (param === 'duration') return `${base}: длительность`
      if (param === 'interval') return `${base}: интервал`
      return `${base}: параметр`
    }
    if (path.includes('exerciseId')) return `${base}: упражнение`
    if (path.includes('.rounds')) return `${base}: раунд`
    if (path.includes('.format')) return `${base}: формат`
    return base
  }
  return path
}

export function formatWorkoutFieldErrors(errors: WorkoutFieldError[]): string[] {
  return errors.map((error) => {
    const label = labelWorkoutField(error.field)
    return error.message ? `${label}: ${error.message}` : label
  })
}

export function stageIndexesFromFieldErrors(errors: WorkoutFieldError[]): number[] {
  const indexes = new Set<number>()
  for (const error of errors) {
    const match = error.field.match(/^stages\[(\d+)\]/)
    if (match) indexes.add(Number(match[1]))
  }
  return [...indexes]
}