import { formatTypes } from '../formats/types'
import type { FormatType } from '../formats/types'
import type { WorkoutFormatType } from './ownWorkoutTypes'

export type StageParamField = {
  key: 'duration' | 'interval' | 'targetRounds'
  label: string
  min: number
  max: number
  suffix: string
  step?: number
}

export type StageFormatCatalogItem = {
  format: WorkoutFormatType
  label: string
  paramFields: StageParamField[]
}

const FORMAT_LABELS: Record<FormatType, string> = {
  AMRAP: 'AMRAP',
  FOR_TIME: 'For Time',
  EMOM: 'EMOM',
  FREE: 'Free Format',
}

const PARAM_FIELDS: Record<FormatType, StageParamField[]> = {
  AMRAP: [{ key: 'duration', label: 'Длительность', min: 1, max: 120, suffix: 'мин' }],
  FOR_TIME: [{ key: 'targetRounds', label: 'Раундов', min: 1, max: 100, suffix: '' }],
  EMOM: [
    { key: 'duration', label: 'Длительность', min: 1, max: 120, suffix: 'мин' },
    { key: 'interval', label: 'Интервал', min: 0.5, max: 10, suffix: 'мин', step: 0.5 },
  ],
  FREE: [],
}

/** Те же типы, что в API `/v1/complex/formats` (см. `features/formats`). */
export const STAGE_FORMAT_CATALOG: StageFormatCatalogItem[] = formatTypes.map((format) => ({
  format,
  label: FORMAT_LABELS[format],
  paramFields: PARAM_FIELDS[format],
}))

export const findCatalogItem = (format: WorkoutFormatType) =>
  STAGE_FORMAT_CATALOG.find((item) => item.format === format)

export const defaultParamsForCatalogItem = (item: StageFormatCatalogItem): Record<string, number> => {
  const defaults: Record<FormatType, Record<string, number>> = {
    AMRAP: { duration: 12 },
    FOR_TIME: { targetRounds: 5 },
    EMOM: { duration: 12, interval: 1 },
    FREE: {},
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
      const suffix = field.suffix ? ` ${field.suffix}` : ''
      return `${field.label}: ${value}${suffix}`
    })
    .filter(Boolean)
    .join(' · ')
}