import { z } from 'zod'
import { api } from '../../api/http'

const detailSchema = z.object({
  id: z.uuid(),
  name: z.string().nullish(),
  title: z.string().nullish(),
})

export async function fetchWorkoutSummary(id: string, signal?: AbortSignal) {
  const { data } = await api.get<unknown>(`/v1/workouts/${encodeURIComponent(id)}`, { signal })
  const parsed = detailSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Сервер вернул некорректную карточку тренировки')
  }
  const title = parsed.data.name?.trim() || parsed.data.title?.trim() || 'Тренировка без названия'
  return { id: parsed.data.id, title }
}