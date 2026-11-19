import { z } from 'zod'
import type { SelectedExercise } from '../exercises/selection'
import { catalogUuidToExerciseId } from './exerciseIdAdapter'
import { unmapExerciseParameters } from './mapExerciseParameters'
import type { WorkoutExerciseRequest, WorkoutFormatType } from './ownWorkoutTypes'
import { createEmptyWorkoutDraft, type WorkoutDraft } from './workoutDraft'

const workoutFormatSchema = z.enum(['AMRAP', 'FOR_TIME', 'EMOM', 'TABATA'])

const workoutExerciseSchema = z.object({
  exerciseId: z.uuid(),
  repetitions: z.number().optional(),
  weightKg: z.number().optional(),
  distanceMeters: z.number().optional(),
  durationMinutes: z.number().optional(),
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
  stageFormatId: z.number().int().positive(),
  format: workoutFormatSchema,
  params: z.record(z.string(), z.number()),
  rounds: z.array(workoutRoundSchema),
})

export const ownWorkoutResponseSchema = z.object({
  id: z.uuid(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  datetime: z.string(),
  durationMinutes: z.number().nullish(),
  stages: z.array(workoutStageSchema),
})

export type OwnWorkoutResponse = z.infer<typeof ownWorkoutResponseSchema>

const exerciseFromEnvelope = (entry: z.infer<typeof workoutExerciseEnvelopeSchema>): WorkoutExerciseRequest | null => {
  if ('parameters' in entry) return entry.parameters
  return entry
}

export const mapOwnWorkoutResponseToDraft = (response: OwnWorkoutResponse): WorkoutDraft => {
  const draft = createEmptyWorkoutDraft()
  draft.name = response.name?.trim() ?? ''
  draft.description = response.description?.trim() ?? ''
  draft.datetime = response.datetime
  draft.durationMinutes = response.durationMinutes ?? null

  for (const stage of response.stages) {
    const stageIndex = stage.position - 1
    if (stageIndex < 0 || stageIndex >= draft.stages.length) continue

    const round: SelectedExercise[] = []
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
          parameters: unmapExerciseParameters(parameters),
        })
      }
    }

    draft.stages[stageIndex] = {
      format: stage.format as WorkoutFormatType,
      stageFormatId: stage.stageFormatId,
      params: { ...stage.params },
      round,
    }
  }

  return draft
}