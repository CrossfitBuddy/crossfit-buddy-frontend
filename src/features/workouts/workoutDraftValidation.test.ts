import { expect, it, beforeEach } from 'vitest'
import { createEmptyWorkoutDraft, getWorkoutDraft, patchWorkoutDraft, patchWorkoutStage, resetWorkoutDraft } from './workoutDraft'
import { validateWorkoutDraft } from './workoutDraftValidation'
import { defaultParamsForCatalogItem, findCatalogItem } from './workoutFormatCatalog'
import { WOD_STAGE_INDEX } from './workoutStageParams'

beforeEach(() => resetWorkoutDraft())

it('не требует название, требует дату и заполненный WOD', () => {
  const result = validateWorkoutDraft(createEmptyWorkoutDraft())
  expect(result.ok).toBe(false)
  if (!result.ok) {
    expect(result.issues.some((issue) => issue.includes('название'))).toBe(false)
    expect(result.issues.some((issue) => issue.includes('WOD'))).toBe(true)
  }
})

it('принимает черновик без названия с заполненным WOD', () => {
  patchWorkoutDraft({ datetime: new Date().toISOString() })
  const amrap = findCatalogItem('AMRAP')!
  patchWorkoutStage(WOD_STAGE_INDEX, {
    format: 'AMRAP',
    params: defaultParamsForCatalogItem(amrap),
    round: [{ key: '1', exerciseId: 'burpee', parameters: {} }],
  })
  expect(validateWorkoutDraft(getWorkoutDraft()).ok).toBe(true)
})

it('сохраняет данные других этапов при изменении WOD', () => {
  patchWorkoutDraft({ datetime: new Date().toISOString(), name: 'Треня' })
  const amrap = findCatalogItem('AMRAP')!
  patchWorkoutStage(0, {
    format: 'AMRAP',
    params: defaultParamsForCatalogItem(amrap),
    round: [{ key: '1', exerciseId: 'row', parameters: {} }],
  })
  const forTime = findCatalogItem('FOR_TIME')!
  patchWorkoutStage(WOD_STAGE_INDEX, {
    format: 'FOR_TIME',
    params: defaultParamsForCatalogItem(forTime),
    round: [{ key: '2', exerciseId: 'burpee', parameters: {} }],
  })

  const draft = getWorkoutDraft()
  expect(draft.name).toBe('Треня')
  expect(draft.stages[0].round[0].exerciseId).toBe('row')
  expect(validateWorkoutDraft(draft).ok).toBe(true)
})