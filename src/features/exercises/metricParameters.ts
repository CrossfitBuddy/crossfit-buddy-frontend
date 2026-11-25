import type { ExerciseParameter } from './catalog'
import type { RoundExercise } from './selection'

export type WorkoutMetricField = 'repetitions' | 'weightKg' | 'durationSeconds' | 'distanceMeters' | 'heightCm'
export type WorkoutMetricValues = Partial<Record<WorkoutMetricField, number>>

const rules = {
  repetitions: { min: 1, max: 2147483647, precision: 0 },
  weightKg: { min: 0, max: 99999.99, precision: 2 },
  durationSeconds: { min: 1, max: 2147483647, precision: 0 },
  distanceMeters: { min: 1, max: 2147483647, precision: 0 },
  heightCm: { min: 1, max: 2147483647, precision: 0 },
} satisfies Record<WorkoutMetricField, { min: number; max: number; precision: number }>

// Совместимость с тестовыми упражнениями редактора #19079.
const legacyFields: Record<string, WorkoutMetricField> = {
  repetitions: 'repetitions', weight: 'weightKg', duration: 'durationSeconds', distance: 'distanceMeters',
}

export function metricField(parameter: ExerciseParameter): WorkoutMetricField | undefined {
  const code = parameter.metricCode
  if (code) return Object.hasOwn(rules, code) ? code as WorkoutMetricField : undefined
  return Object.hasOwn(legacyFields, parameter.id) ? legacyFields[parameter.id] : undefined
}

export const metricParameterKey = (parameter: ExerciseParameter) => metricField(parameter) ?? parameter.id

export function metricParameterValue(item: RoundExercise, parameter: ExerciseParameter) {
  return item.parameters[metricParameterKey(parameter)] ?? item.parameters[parameter.id]
}

export function metricParameterError(item: RoundExercise, parameter: ExerciseParameter) {
  const value = metricParameterValue(item, parameter)
  if (value === undefined) return undefined
  const field = metricField(parameter)
  if (!field) return 'Сохранение этого параметра пока недоступно.'
  if ((item.exercise?.parameters ?? []).filter(entry => metricField(entry) === field).length > 1) {
    return 'Настройки этого параметра недоступны: он указан несколько раз.'
  }
  if (!Number.isFinite(value)) return 'Введите число.'
  const rule = rules[field]
  const min = Math.max(rule.min, parameter.min ?? rule.min)
  const max = Math.min(rule.max, parameter.max ?? rule.max)
  if (value < min || value > max) return `Введите значение от ${min} до ${max}.`
  if ((parameter.valueType === 'INTEGER' || rule.precision === 0) && !Number.isInteger(value)) return 'Введите целое число.'
  const precision = Math.min(rule.precision, parameter.precision ?? rule.precision)
  if (value !== Number(value.toFixed(precision))) return `Не более ${precision} знаков после запятой.`
  return undefined
}

export function roundMetricValues(item: RoundExercise): WorkoutMetricValues {
  const result: WorkoutMetricValues = {}
  for (const [key, value] of Object.entries(item.parameters)) {
    const definition = item.exercise?.parameters?.find(parameter => parameter.id === key || metricParameterKey(parameter) === key)
      ?? { id: key, name: key, valueType: 'DECIMAL' as const, unit: '', metricCode: key }
    const error = metricParameterError(item, definition)
    const field = metricField(definition)
    if (error || !field) throw new Error(error ?? 'Сохранение этого параметра пока недоступно.')
    result[field] = value
  }
  return result
}

export const toWorkoutExerciseRequest = (item: RoundExercise) => ({ exerciseId: item.exerciseId, ...roundMetricValues(item) })
