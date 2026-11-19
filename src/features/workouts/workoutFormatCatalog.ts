import type { WorkoutFormatType } from './ownWorkoutTypes'

export type StageParamField = {
  key: 'duration' | 'interval'
  label: string
  min: number
  max: number
  suffix: string
  step?: number
}

export type StageFormatCatalogItem = {
  stageFormatId: number
  format: WorkoutFormatType
  label: string
  paramFields: StageParamField[]
}

/** Справочник stage_format / workout_format до подключения API #18698. */
export const STAGE_FORMAT_CATALOG: StageFormatCatalogItem[] = [
  {
    stageFormatId: 1,
    format: 'AMRAP',
    label: 'AMRAP',
    paramFields: [{ key: 'duration', label: 'Длительность', min: 1, max: 120, suffix: 'мин' }],
  },
  {
    stageFormatId: 2,
    format: 'FOR_TIME',
    label: 'For Time',
    paramFields: [],
  },
  {
    stageFormatId: 3,
    format: 'EMOM',
    label: 'EMOM',
    paramFields: [
      { key: 'duration', label: 'Длительность', min: 1, max: 120, suffix: 'мин' },
      { key: 'interval', label: 'Интервал', min: 0.5, max: 10, suffix: 'мин', step: 0.5 },
    ],
  },
  {
    stageFormatId: 4,
    format: 'TABATA',
    label: 'Tabata',
    paramFields: [
      { key: 'duration', label: 'Длительность', min: 1, max: 60, suffix: 'мин' },
      { key: 'interval', label: 'Интервал', min: 0.1, max: 5, suffix: 'мин', step: 0.5 },
    ],
  },
]

export const findCatalogItem = (format: WorkoutFormatType) =>
  STAGE_FORMAT_CATALOG.find((item) => item.format === format)

export const defaultParamsForCatalogItem = (item: StageFormatCatalogItem): Record<string, number> => {
  const defaults: Record<WorkoutFormatType, Record<string, number>> = {
    AMRAP: { duration: 12 },
    FOR_TIME: {},
    EMOM: { duration: 12, interval: 1 },
    TABATA: { duration: 4, interval: 0.5 },
  }
  return { ...defaults[item.format] }
}

export const formatStageParamsSummary = (format: WorkoutFormatType, params: Record<string, number>) => {
  const item = findCatalogItem(format)
  if (!item) return ''
  return item.paramFields
    .map((field) => {
      const value = params[field.key]
      if (value === undefined || Number.isNaN(value)) return null
      return `${field.label}: ${value} ${field.suffix}`
    })
    .filter(Boolean)
    .join(' · ')
}