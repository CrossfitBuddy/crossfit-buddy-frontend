import { z } from 'zod'
import { formatTypes } from '../formats/types'
import type { FormatType } from '../formats/types'
import type { RoundExercise } from '../exercises/selection'
import { catalogUuidToExerciseId } from './exerciseIdAdapter'
import { unmapExerciseParameters } from './mapExerciseParameters'
import type { WorkoutExerciseRequest, WorkoutFormatType } from './ownWorkoutTypes'
import { createEmptyWorkoutDraft, type WorkoutDraft } from './workoutDraft'

const workoutFormatSchema = z.enum(formatTypes)

const workoutExerciseSchema = z.object({
  exerciseId: z.uuid(),
  repetitions: z.number().optional(),
  weightKg: z.number().optional(),
  distanceMeters: z.number().optional(),
  durationSeconds: z.number().optional(),
})

const workoutExerciseEnvelopeSchema = z.union([
  workoutExerciseSchema,
  z.object({ parameters: workoutExerciseSchema }),
])

const workoutRoundSchema = z.object({
  repeatCount: z.number().int().positive().optional(),
  exercises: z.array(workoutExerciseEnvelopeSchema),
})

const workoutStageSchema = z.object({
  position: z.number().int().positive(),
  workoutStageId: z.number().int().positive(),
  format: workoutFormatSchema,
  timeLimitSeconds: z.number().int().positive().optional(),
  intervalSeconds: z.number().int().positive().optional(),
  targetRounds: z.number().int().positive().optional(),
  rounds: z.array(workoutRoundSchema),
})

export const ownWorkoutResponseSchema = z.object({
  id: z.uuid(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  datetime: z.string(),
  durationSeconds: z.number().int().positive().nullish(),
  stages: z.array(workoutStageSchema),
})

export type OwnWorkoutResponse = z.infer<typeof ownWorkoutResponseSchema>

const secondsToMinutes = (seconds: number) => seconds / 60

const stageParamsFromResponse = (format: FormatType, stage: z.infer<typeof workoutStageSchema>): Record<string, number> => {
  switch (format) {
    case 'AMRAP':
      return typeof stage.timeLimitSeconds === 'number'
        ? { duration: secondsToMinutes(stage.timeLimitSeconds) }
        : {}
    case 'EMOM': {
      const params: Record<string, number> = {}
      if (typeof stage.timeLimitSeconds === 'number') params.duration = secondsToMinutes(stage.timeLimitSeconds)
      if (typeof stage.intervalSeconds === 'number') params.interval = secondsToMinutes(stage.intervalSeconds)
      return params
    }
    case 'FOR_TIME':
      return typeof stage.targetRounds === 'number' ? { targetRounds: stage.targetRounds } : {}
    case 'FREE':
      return {}
    default:
      return {}
  }
}

const exerciseFromEnvelope = (entry: z.infer<typeof workoutExerciseEnvelopeSchema>): WorkoutExerciseRequest | null => {
  if ('parameters' in entry) return entry.parameters
  return entry
}

export const mapOwnWorkoutResponseToDraft = (response: OwnWorkoutResponse): WorkoutDraft => {
  const draft = createEmptyWorkoutDraft()
  draft.name = response.name?.trim() ?? ''
  draft.description = response.description?.trim() ?? ''
  draft.datetime = response.datetime
  draft.durationMinutes =
    typeof response.durationSeconds === 'number' && response.durationSeconds > 0
      ? secondsToMinutes(response.durationSeconds)
      : null

  for (const stage of response.stages) {
    const stageIndex = stage.position - 1
    if (stageIndex < 0 || stageIndex >= draft.stages.length) continue

    const round: RoundExercise[] = []
    let itemKey = 1
    for (const workoutRound of stage.rounds) {
      for (const envelope of workoutRound.exercises) {
        const parameters = exerciseFromEnvelope(envelope)
        if (!parameters) continue
        const exerciseId = catalogUuidToExerciseId(parameters.exerciseId)
        if (!exerciseId) continue
        round.push({
          key: String(itemKey++),
          exerciseId,
          parameters: unmapExerciseParameters(parameters) ?? {},
        })
      }
    }

    const format = stage.format as WorkoutFormatType
    draft.stages[stageIndex] = {
      workoutStageId: stage.workoutStageId,
      format,
      params: stageParamsFromResponse(stage.format, stage),
      round,
    }
  }

  return draft
}