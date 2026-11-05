import { z } from 'zod'
import { api } from '../../api/http'
import { formatCodes } from './types'
import type { ComplexFormat, FormatsApi } from './types'

const FORMATS_PATH = '/api/v1/complex-formats'

const formatSchema = z.object({
  code: z.string(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  duration: z.number().nullish(),
  interval: z.number().nullish(),
})

const formatTitles: Record<ComplexFormat['code'], string> = {
  EMOM: 'EMOM',
  FOR_TIME: 'For Time',
  AMRAP: 'AMRAP',
  TABATA: 'Tabata',
}

export function parseFormats(data: unknown): ComplexFormat[] {
  const result = z.array(formatSchema).safeParse(data)
  if (!result.success) throw new Error('Сервер вернул некорректный список форматов')
  return formatCodes.flatMap((code) => {
    const item = result.data.find((entry) => entry.code === code)
    if (!item) return []
    return [{
      code,
      name: item.name || formatTitles[code],
      description: item.description ?? '',
      duration: item.duration ?? null,
      interval: item.interval ?? null,
    }]
  })
}

export const formatsApi: FormatsApi = {
  async getFormats(signal) {
    const { data } = await api.get<unknown>(FORMATS_PATH, { signal })
    return parseFormats(data)
  },
  async updateDescription(code, description) {
    await api.patch(`${FORMATS_PATH}/${code}`, { description })
  },
}
