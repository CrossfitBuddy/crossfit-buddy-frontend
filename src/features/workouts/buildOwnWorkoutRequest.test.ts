import { expect, it, beforeEach } from 'vitest'
import { buildOwnWorkoutRequest } from './buildOwnWorkoutRequest'
import { getWorkoutDraft, patchWorkoutDraft, patchWorkoutStage, resetWorkoutDraft } from './workoutDraft'
import { defaultParamsForCatalogItem, findCatalogItem } from './workoutFormatCatalog'
import type { WorkoutFormatType } from './ownWorkoutTypes'
import { WOD_STAGE_INDEX } from './workoutStageParams'

const formats: WorkoutFormatType[] = ['AMRAP', 'FOR_TIME', 'EMOM', 'TABATA']

beforeEach(() => resetWorkoutDraft())

const fillWod = (format: WorkoutFormatType) => {
  const catalog = findCatalogItem(format)!
  patchWorkoutDraft({ datetime: '2026-11-19T10:00:00+07:00' })
  patchWorkoutStage(WOD_STAGE_INDEX, {
    format,
    stageFormatId: catalog.stageFormatId,
    params: defaultParamsForCatalogItem(catalog),
    round: [{ key: '1', exerciseId: 'burpee' }],
  })
}

formats.forEach((format) => {
  it(`собирает DTO для формата ${format}`, () => {
    fillWod(format)
    const request = buildOwnWorkoutRequest(getWorkoutDraft())

    expect(request).not.toBeNull()
    expect(request!.stages).toHaveLength(1)
    expect(request!.stages[0].format).toBe(format)
    expect(request!.stages[0].stageFormatId).toBe(findCatalogItem(format)!.stageFormatId)
    expect(request!.stages[0].rounds[0].exercises[0].exerciseId).toMatch(/^[0-9a-f-]{36}$/i)
    if (format === 'FOR_TIME') expect(request!.stages[0].params).toEqual({})
    if (format === 'AMRAP') expect(request!.stages[0].params.duration).toBeGreaterThan(0)
    if (format === 'EMOM') {
      expect(request!.stages[0].params.duration).toBeDefined()
      expect(request!.stages[0].params.interval).toBeDefined()
    }
  })
})

it('не включает пустые этапы в stages', () => {
  fillWod('AMRAP')
  const request = buildOwnWorkoutRequest(getWorkoutDraft())
  expect(request!.stages).toHaveLength(1)
})

it('отдаёт name null если название пустое', () => {
  patchWorkoutDraft({ datetime: '2026-11-19T10:00:00+07:00', name: '  ' })
  fillWod('AMRAP')
  const request = buildOwnWorkoutRequest(getWorkoutDraft())
  expect(request!.name).toBeNull()
})