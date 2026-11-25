import { expect, it } from 'vitest'
import type { ExerciseParameter } from './catalog'
import type { RoundExercise } from './selection'
import { toWorkoutExerciseRequest } from './metricParameters'

const id = '60fdbba6-0f4a-4dda-9332-f10a5e35ea55'
const metric = (metricCode?: string): ExerciseParameter => ({
  id: '919022a0-ff7c-4136-b881-fa08706df7b5', name: 'Произвольное название',
  valueType: 'DECIMAL', unit: 'раз', metricCode,
})
function item(parameter: ExerciseParameter, value: number): RoundExercise {
  return { key: 'entry', exerciseId: id, parameters: { [parameter.id]: value },
    exercise: { id, name: 'Упражнение', category: 'Силовые', equipment: '', description: '', parameters: [parameter] } }
}

it.each([
  ['repetitions', 12], ['weightKg', 12.25], ['durationSeconds', 90], ['distanceMeters', 500], ['heightCm', 40],
])('передаёт %s по коду, сохраняя UUID упражнения', (code, value) => {
  expect(toWorkoutExerciseRequest(item(metric(code), value))).toEqual({ exerciseId: id, [code]: value })
})

it('передаёт секунды без преобразования в минуты и сохраняет нулевой вес', () => {
  expect(toWorkoutExerciseRequest(item(metric('durationSeconds'), 90))).toEqual({ exerciseId: id, durationSeconds: 90 })
  expect(toWorkoutExerciseRequest(item(metric('weightKg'), 0))).toEqual({ exerciseId: id, weightKg: 0 })
})

it.each([undefined, 'custom', 'durationMinutes', '__proto__'])('не теряет введённое значение неподдержанного кода %s', code => {
  const entry = item({ ...metric(code), name: 'Количество повторений' }, 10)
  expect(() => toWorkoutExerciseRequest(entry)).toThrow('Сохранение этого параметра пока недоступно')
  expect(Object.values(entry.parameters)).toEqual([10])
})

it.each([
  ['repetitions', -1], ['repetitions', 0], ['repetitions', 1.5], ['repetitions', 2147483648],
  ['weightKg', -1], ['weightKg', 100000], ['weightKg', 1.234],
  ['durationSeconds', 0], ['durationSeconds', 0.5], ['distanceMeters', 1.5], ['heightCm', NaN],
])('отклоняет невалидное значение %s=%s перед формированием DTO', (code, value) => {
  expect(() => toWorkoutExerciseRequest(item(metric(code), value))).toThrow()
})

it('не перезаписывает две разные метрики с одинаковым кодом', () => {
  const entry = item(metric('repetitions'), 8)
  entry.exercise!.parameters!.push({ ...metric('repetitions'), id: 'second-metric' })
  entry.parameters['second-metric'] = 12
  expect(() => toWorkoutExerciseRequest(entry)).toThrow('указан несколько раз')
})

it('разрешает упражнение без необязательных значений', () => {
  const entry = item(metric(), 10)
  entry.parameters = {}
  expect(toWorkoutExerciseRequest(entry)).toEqual({ exerciseId: id })
})
