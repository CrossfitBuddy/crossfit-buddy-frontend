import type { SelectedExercise } from '../exercises/selection'
import { catalogExerciseIdToUuid } from './exerciseIdAdapter'
import type { OwnWorkoutRequest, WorkoutExerciseRequest, WorkoutStageRequest } from './ownWorkoutTypes'
import type { WorkoutDraft, WorkoutStageDraft } from './workoutDraft'
import { findCatalogItem } from './workoutFormatCatalog'
import { areStageParamsValid } from './workoutStageParams'

const mapExercises = (round: SelectedExercise[]): WorkoutExerciseRequest[] =>
  round.flatMap((item) => {
    const exerciseId = catalogExerciseIdToUuid(item.exerciseId)
    return exerciseId ? [{ exerciseId }] : []
  })

const mapStage = (stage: WorkoutStageDraft): WorkoutStageRequest | null => {
  if (!stage.format || stage.round.length === 0) return null
  const catalog = findCatalogItem(stage.format)
  if (!catalog || !areStageParamsValid(stage.format, stage.params)) return null

  return {
    stageFormatId: catalog.stageFormatId,
    format: stage.format,
    params: { ...stage.params },
    rounds: [{ repeatCount: 1, exercises: mapExercises(stage.round) }],
  }
}

export const buildOwnWorkoutRequest = (draft: WorkoutDraft): OwnWorkoutRequest | null => {
  if (!draft.datetime) return null

  const stages = draft.stages.flatMap((stage) => {
    const mapped = mapStage(stage)
    return mapped ? [mapped] : []
  })

  if (!stages.length) return null

  const name = draft.name.trim()
  const description = draft.description.trim()

  return {
    name: name || null,
    description: description || null,
    datetime: draft.datetime,
    durationMinutes: draft.durationMinutes ?? null,
    stages,
  }
}