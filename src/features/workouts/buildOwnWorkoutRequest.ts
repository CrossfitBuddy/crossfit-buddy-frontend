import type { RoundExercise } from '../exercises/selection'
import { catalogExerciseIdToUuid } from './exerciseIdAdapter'
import type { OwnWorkoutRequest, WorkoutExerciseRequest, WorkoutStageRequest } from './ownWorkoutTypes'
import type { WorkoutDraft, WorkoutStageDraft } from './workoutDraft'
import { findCatalogItem } from './workoutFormatCatalog'
import { areStageParamsValid } from './workoutStageParams'

const minutesToSeconds = (minutes: number) => Math.round(minutes * 60)

const stageTimingFields = (
  format: WorkoutStageDraft['format'],
  params: Record<string, number>,
): Pick<WorkoutStageRequest, 'timeLimitSeconds' | 'intervalSeconds' | 'targetRounds'> => {
  if (!format) return {}
  switch (format) {
    case 'AMRAP':
      return { timeLimitSeconds: minutesToSeconds(params.duration) }
    case 'EMOM':
      return {
        timeLimitSeconds: minutesToSeconds(params.duration),
        intervalSeconds: minutesToSeconds(params.interval),
      }
    case 'FOR_TIME':
      return { targetRounds: params.targetRounds }
    case 'FREE':
      return {}
    default:
      return {}
  }
}

const mapExercises = (round: RoundExercise[]): WorkoutExerciseRequest[] =>
  round.flatMap((item) => {
    const exerciseId = catalogExerciseIdToUuid(item.exerciseId)
    return exerciseId ? [{ exerciseId }] : []
  })

const mapStage = (stage: WorkoutStageDraft): WorkoutStageRequest | null => {
  if (!stage.format || stage.round.length === 0) return null
  const catalog = findCatalogItem(stage.format)
  if (!catalog || !areStageParamsValid(stage.format, stage.params)) return null

  return {
    workoutStageId: stage.workoutStageId,
    format: stage.format,
    ...stageTimingFields(stage.format, stage.params),
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
  const durationSeconds =
    typeof draft.durationMinutes === 'number' && draft.durationMinutes > 0
      ? minutesToSeconds(draft.durationMinutes)
      : null

  return {
    name: name || null,
    description: description || null,
    datetime: draft.datetime,
    durationSeconds,
    stages,
  }
}