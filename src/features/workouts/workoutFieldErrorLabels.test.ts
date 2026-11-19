import { expect, it } from 'vitest'
import { formatWorkoutFieldErrors, stageIndexesFromFieldErrors } from './workoutFieldErrorLabels'

it('форматирует пути этапов и выделяет индексы', () => {
  const errors = [
    { field: 'stages[2].params.duration', code: 'REQUIRED_PARAMETER', message: 'Duration is required' },
    { field: 'stages[2].rounds[0].exercises[0].exerciseId', code: 'UNKNOWN_REFERENCE', message: 'No exercise' },
  ]
  expect(formatWorkoutFieldErrors(errors)).toEqual([
    'WOD: длительность: Duration is required',
    'WOD: упражнение: No exercise',
  ])
  expect(stageIndexesFromFieldErrors(errors)).toEqual([2])
})