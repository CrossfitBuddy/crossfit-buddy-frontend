import { expect, it, beforeEach } from 'vitest'
import { buildOwnWorkoutRequest } from './buildOwnWorkoutRequest'
import { getWorkoutDraft, patchWorkoutDraft, patchWorkoutStage, resetWorkoutDraft } from './workoutDraft'
import { defaultParamsForCatalogItem, findCatalogItem } from './workoutFormatCatalog'
import type { WorkoutFormatType } from './ownWorkoutTypes'
import { WOD_STAGE_INDEX } from './workoutStageParams'

const formats: WorkoutFormatType[] = ['AMRAP', 'FOR_TIME', 'EMOM', 'FREE']

beforeEach(() => resetWorkoutDraft())

const fillWod = (format: WorkoutFormatType) => {
  const catalog = findCatalogItem(format)!
  patchWorkoutDraft({ datetime: '2026-11-19T10:00:00+07:00' })
  patchWorkoutStage(WOD_STAGE_INDEX, {
    format,
    params: defaultParamsForCatalogItem(catalog),
    round: [{ key: '1', exerciseId: 'burpee', parameters: {} }],
  })
}

formats.forEach((format) => {
  it(`собирает DTO для формата ${format}`, () => {
    fillWod(format)
    const request = buildOwnWorkoutRequest(getWorkoutDraft())

    expect(request).not.toBeNull()
    expect(request!.stages).toHaveLength(1)
    expect(request!.stages[0].format).toBe(format)
    expect(request!.stages[0].workoutStageId).toBe(WOD_STAGE_INDEX + 1)
    expect(request!.stages[0].rounds[0].exercises[0].exerciseId).toMatch(/^[0-9a-f-]{36}$/i)
    if (format === 'FOR_TIME') expect(request!.stages[0].targetRounds).toBeGreaterThan(0)
    if (format === 'AMRAP') expect(request!.stages[0].timeLimitSeconds).toBeGreaterThan(0)
    if (format === 'EMOM') {
      expect(request!.stages[0].timeLimitSeconds).toBeGreaterThan(0)
      expect(request!.stages[0].intervalSeconds).toBeGreaterThan(0)
    }
    if (format === 'FREE') {
      expect(request!.stages[0].timeLimitSeconds).toBeUndefined()
      expect(request!.stages[0].targetRounds).toBeUndefined()
    }
  })
})

it('не включает пустые этапы в stages', () => {
  fillWod('AMRAP')
  const request = buildOwnWorkoutRequest(getWorkoutDraft())
  expect(request!.stages).toHaveLength(1)
})

it('не меняет workoutStageId в DTO при смене формата этапа', () => {
  const amrap = findCatalogItem('AMRAP')!
  const emom = findCatalogItem('EMOM')!
  patchWorkoutDraft({ datetime: '2026-11-19T10:00:00+07:00' })
  patchWorkoutStage(0, {
    format: 'AMRAP',
    params: defaultParamsForCatalogItem(amrap),
    round: [{ key: '1', exerciseId: 'burpee', parameters: {} }],
  })
  patchWorkoutStage(0, {
    format: 'EMOM',
    params: defaultParamsForCatalogItem(emom),
  })
  const request = buildOwnWorkoutRequest(getWorkoutDraft())
  expect(request!.stages[0].workoutStageId).toBe(1)
  expect(request!.stages[0].format).toBe('EMOM')
})

it('отдаёт name null если название пустое', () => {
  patchWorkoutDraft({ datetime: '2026-11-19T10:00:00+07:00', name: '  ' })
  fillWod('AMRAP')
  const request = buildOwnWorkoutRequest(getWorkoutDraft())
  expect(request!.name).toBeNull()
})

it('переводит durationMinutes в durationSeconds', () => {
  patchWorkoutDraft({ datetime: '2026-11-19T10:00:00+07:00', durationMinutes: 45 })
  fillWod('AMRAP')
  const request = buildOwnWorkoutRequest(getWorkoutDraft())
  expect(request!.durationSeconds).toBe(45 * 60)
})