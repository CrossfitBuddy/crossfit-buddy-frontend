import { expect, it } from 'vitest'
import { mapExerciseParameters } from './mapExerciseParameters'

it('переносит метрики в поля WorkoutExerciseRequest', () => {
  expect(mapExerciseParameters({ repetitions: 10, weight: 43, duration: 2 })).toEqual({
    repetitions: 10,
    weightKg: 43,
    durationSeconds: 2,
  })
})