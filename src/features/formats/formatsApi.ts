import { z } from 'zod'
import { api } from '../../api/http'
import { formatTypes } from './types'
import type { ComplexFormat, FormatsApi } from './types'

const WORKOUTS_PATH = '/api/v1/workouts'

const formatSchema = z.object({
  type: z.string(),
  name: z.string(),
  description: z.string(),
  durationRequired: z.boolean(),
  intervalRequired: z.boolean(),
})

function parseFormats(data: unknown): ComplexFormat[] {
  const result = z.array(formatSchema).safeParse(data)
  if (!result.success) throw new Error('Сервер вернул некорректный список форматов')
  return formatTypes.flatMap((type) => {
    const item = result.data.find((entry) => entry.type === type)
    return item ? [{ ...item, type }] : []
  })
}

export const formatsApi: FormatsApi = {
  async getFormats(signal) {
    const { data } = await api.get<unknown>(`${WORKOUTS_PATH}/formats`, { signal })
    return parseFormats(data)
  },
  async updateDescription(type, description) {
    const { data } = await api.patch<unknown>(`${WORKOUTS_PATH}/${type}`, { description })
    const result = formatSchema.extend({ type: z.literal(type) }).safeParse(data)
    if (!result.success) throw new Error('Сервер вернул некорректный формат')
    return result.data
  },
}
