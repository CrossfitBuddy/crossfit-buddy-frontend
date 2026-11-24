import { z } from 'zod'
import { api } from '../../api/http'
import type { Exercise } from './catalog'

export type CatalogSearch = { query: string; category: string; equipment: string }
export type CatalogOption = { value: string; label: string }
export type CatalogFilters = { categories: CatalogOption[]; equipment: CatalogOption[] }

export type CatalogApi = {
  getFilters: (signal: AbortSignal) => Promise<CatalogFilters>
  search: (search: CatalogSearch, signal: AbortSignal) => Promise<Exercise[]>
  getExercise: (id: string, signal: AbortSignal) => Promise<Exercise>
}

const root = '/v1/general-exercises'
const categoryLabels = {
  STRENGTH: 'Силовые', CARDIO: 'Кардио', GYMNASTICS: 'Гимнастика',
  WEIGHTLIFTING: 'Тяжёлая атлетика', OTHER: 'Другое',
} as const

const parameterSchema = z.object({
  id: z.string().uuid(), name: z.string(), metricsValueType: z.enum(['INTEGER', 'FLOAT']), unit: z.string(),
})
const equipmentSchema = z.object({
  id: z.string().uuid(), name: z.string(), imageFileId: z.string().uuid().nullish(),
  equipmentProperties: z.array(parameterSchema).nullish(),
})
const exerciseSchema = z.object({
  id: z.string().uuid(), name: z.string(), description: z.string(),
  category: z.enum(['STRENGTH', 'CARDIO', 'GYMNASTICS', 'WEIGHTLIFTING', 'OTHER']),
  imageFileId: z.string().uuid().nullish(), videoFileId: z.string().uuid().nullish(),
  exercisesMetrics: z.array(parameterSchema).nullish(), exerciseEquipments: z.array(equipmentSchema).nullish(),
})

const parameter = (value: z.infer<typeof parameterSchema>) => ({
  id: value.id, name: value.name, unit: value.unit,
  valueType: value.metricsValueType === 'FLOAT' ? 'DECIMAL' as const : 'INTEGER' as const,
})

function exercise(value: z.infer<typeof exerciseSchema>): Exercise {
  const equipment = value.exerciseEquipments ?? []
  return {
    id: value.id, name: value.name, description: value.description, category: categoryLabels[value.category],
    equipment: equipment.map(item => item.name).join(', ') || 'Без оборудования',
    imageFileId: value.imageFileId || undefined, videoFileId: value.videoFileId || undefined,
    parameters: (value.exercisesMetrics ?? []).map(parameter),
    equipmentDetails: equipment.map(item => ({
      id: item.id, name: item.name, parameters: (item.equipmentProperties ?? []).map(parameter),
    })),
  }
}

export const catalogApi: CatalogApi = {
  async getFilters(signal) {
    const { data } = await api.get<unknown>(root + '/get/equipments', { signal })
    const result = z.array(equipmentSchema).safeParse(data)
    if (!result.success) throw new Error('Сервер вернул некорректный список оборудования')
    return {
      categories: Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
      equipment: result.data.map(item => ({ value: item.id, label: item.name })),
    }
  },
  async search({ query, category, equipment }, signal) {
    const { data } = await api.get<unknown>(root + '/catalog', {
      signal, params: {
        ...(query.trim() ? { name: query.trim() } : {}),
        ...(category !== 'all' ? { category } : {}),
        ...(equipment !== 'all' ? { equipmentId: equipment } : {}),
      },
    })
    const result = z.array(exerciseSchema).safeParse(data)
    if (!result.success) throw new Error('Сервер вернул некорректный каталог упражнений')
    return result.data.map(exercise)
  },
  async getExercise(id, signal) {
    const { data } = await api.get<unknown>(root + '/' + encodeURIComponent(id), { signal })
    const result = exerciseSchema.safeParse(data)
    if (!result.success) throw new Error('Сервер вернул некорректные данные упражнения')
    return exercise(result.data)
  },
}
