import { expect, it } from 'vitest'
import { catalogExerciseIdToUuid } from './exerciseIdAdapter'
import { mapOwnWorkoutResponseToDraft } from './ownWorkoutResponse'
import { getWorkoutDraft, replaceWorkoutDraft } from './workoutDraft'

it('маппит ответ API в черновик по position этапа', () => {
  const burpeeUuid = catalogExerciseIdToUuid('burpee')!
  const draft = mapOwnWorkoutResponseToDraft({
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    name: 'WOD',
    description: null,
    datetime: '2026-11-19T10:00:00.000Z',
    durationMinutes: 60,
    stages: [{
      position: 3,
      stageFormatId: 1,
      format: 'AMRAP',
      params: { duration: 12 },
      rounds: [{
        repeatCount: 1,
        exercises: [{
          parameters: {
            exerciseId: burpeeUuid,
            repetitions: 10,
          },
        }],
      }],
    }],
  })

  expect(draft.name).toBe('WOD')
  expect(draft.durationMinutes).toBe(60)
  expect(draft.stages[2].format).toBe('AMRAP')
  expect(draft.stages[2].round).toEqual([{
    key: '1',
    exerciseId: 'burpee',
    parameters: { repetitions: 10 },
  }])
})

it('replaceWorkoutDraft обновляет подписчиков', () => {
  const next = mapOwnWorkoutResponseToDraft({
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    name: 'После замены',
    description: '',
    datetime: '2026-11-19T12:00:00.000Z',
    durationMinutes: null,
    stages: [],
  })
  replaceWorkoutDraft(next)
  expect(getWorkoutDraft().name).toBe('После замены')
})