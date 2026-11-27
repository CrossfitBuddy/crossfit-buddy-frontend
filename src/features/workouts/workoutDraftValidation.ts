import { buildOwnWorkoutRequest } from './buildOwnWorkoutRequest'
import { WORKOUT_STAGE_TITLES, type WorkoutDraft, type WorkoutStageDraft } from './workoutDraft'
import { areStageParamsValid, invalidStageParamFields, WOD_STAGE_INDEX } from './workoutStageParams'

const isStageFilled = (stage: WorkoutStageDraft) =>
  stage.format !== null || stage.round.length > 0

const isStageComplete = (stage: WorkoutStageDraft) => {
  if (!stage.format) return stage.round.length === 0
  if (!areStageParamsValid(stage.format, stage.params)) return false
  return stage.round.length > 0
}

export const validateWorkoutDraft = (draft: WorkoutDraft): { ok: true } | { ok: false; issues: string[] } => {
  const issues: string[] = []

  if (!draft.datetime) issues.push('Укажите дату и время')

  const wod = draft.stages[WOD_STAGE_INDEX]
  if (!wod.format) {
    issues.push(`Для этапа «${WORKOUT_STAGE_TITLES[WOD_STAGE_INDEX]}» выберите формат`)
  } else if (!areStageParamsValid(wod.format, wod.params)) {
    const bad = invalidStageParamFields(wod.format, wod.params)
    issues.push(
      bad.length
        ? `Исправьте параметры этапа «${WORKOUT_STAGE_TITLES[WOD_STAGE_INDEX]}»: ${bad.map((f) => f.label).join(', ')}`
        : `Заполните параметры этапа «${WORKOUT_STAGE_TITLES[WOD_STAGE_INDEX]}»`,
    )
  } else if (wod.round.length === 0) {
    issues.push(`Соберите раунд для этапа «${WORKOUT_STAGE_TITLES[WOD_STAGE_INDEX]}»`)
  }

  draft.stages.forEach((stage, index) => {
    if (index === WOD_STAGE_INDEX) return
    if (!isStageFilled(stage)) return
    if (!isStageComplete(stage)) {
      issues.push(`Дозаполните этап «${WORKOUT_STAGE_TITLES[index]}» или очистите формат и раунд`)
    }
  })

  if (!issues.length && !buildOwnWorkoutRequest(draft)) {
    issues.push('Не удалось собрать данные тренировки')
  }

  return issues.length ? { ok: false, issues } : { ok: true }
}

export const canSaveWorkoutDraft = (draft: WorkoutDraft) => validateWorkoutDraft(draft).ok