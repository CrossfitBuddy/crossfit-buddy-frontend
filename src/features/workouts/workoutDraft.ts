import { useSyncExternalStore } from 'react'
import type { SelectedExercise } from '../exercises/selection'
import type { WorkoutFormatType } from './ownWorkoutTypes'

export const WORKOUT_STAGE_TITLES = ['Разминка', 'Сила и навык', 'WOD', 'Заминка'] as const

export type WorkoutFormat = WorkoutFormatType

export type WorkoutStageDraft = {
  format: WorkoutFormat | null
  stageFormatId: number | null
  params: Record<string, number>
  round: SelectedExercise[]
}

export type WorkoutDraft = {
  name: string
  description: string
  datetime: string
  durationMinutes: number | null
  stages: WorkoutStageDraft[]
}

const emptyStage = (): WorkoutStageDraft => ({
  format: null,
  stageFormatId: null,
  params: {},
  round: [],
})

export const createEmptyWorkoutDraft = (): WorkoutDraft => ({
  name: '',
  description: '',
  datetime: '',
  durationMinutes: null,
  stages: WORKOUT_STAGE_TITLES.map(() => emptyStage()),
})

let draft: WorkoutDraft = createEmptyWorkoutDraft()
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getWorkoutDraft = () => draft

export const resetWorkoutDraft = () => {
  draft = createEmptyWorkoutDraft()
  emit()
}

export const replaceWorkoutDraft = (next: WorkoutDraft) => {
  draft = {
    ...next,
    stages: next.stages.map((stage) => ({
      ...stage,
      params: { ...stage.params },
      round: stage.round.map((item) => ({ ...item, parameters: item.parameters ? { ...item.parameters } : undefined })),
    })),
  }
  emit()
}

export const patchWorkoutDraft = (patch: Partial<Omit<WorkoutDraft, 'stages'>>) => {
  draft = { ...draft, ...patch }
  emit()
}

export const patchWorkoutStage = (index: number, patch: Partial<WorkoutStageDraft>) => {
  draft = {
    ...draft,
    stages: draft.stages.map((stage, stageIndex) => (stageIndex === index ? { ...stage, ...patch } : stage)),
  }
  emit()
}

export const setStageRound = (index: number, round: SelectedExercise[]) => {
  patchWorkoutStage(index, { round: [...round] })
}

export const useWorkoutDraft = () => useSyncExternalStore(subscribe, getWorkoutDraft, getWorkoutDraft)