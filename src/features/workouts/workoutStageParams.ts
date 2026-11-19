import type { WorkoutFormatType } from './ownWorkoutTypes'
import { findCatalogItem, formatStageParamsSummary, type StageParamField } from './workoutFormatCatalog'

export const WOD_STAGE_INDEX = 2

export const stageParamFields = (format: WorkoutFormatType): StageParamField[] => findCatalogItem(format)?.paramFields ?? []

export const areStageParamsValid = (format: WorkoutFormatType, params: Record<string, number>) =>
  stageParamFields(format).every((field) => {
    const value = params[field.key]
    return typeof value === 'number' && !Number.isNaN(value) && value >= field.min && value <= field.max
  })

export const invalidStageParamFields = (format: WorkoutFormatType, params: Record<string, number>) =>
  stageParamFields(format).filter((field) => {
    const value = params[field.key]
    return !(typeof value === 'number' && !Number.isNaN(value) && value >= field.min && value <= field.max)
  })

export { formatStageParamsSummary }