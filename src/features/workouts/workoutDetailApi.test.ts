import { afterEach, expect, it, vi } from 'vitest'
import { api } from '../../api/http'
import { fetchWorkoutSummary } from './workoutDetailApi'

afterEach(() => vi.restoreAllMocks())

it('читает название карточки после создания', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({
    data: { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'Fran' },
  })

  await expect(fetchWorkoutSummary('3fa85f64-5717-4562-b3fc-2c963f66afa6')).resolves.toEqual({
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    title: 'Fran',
  })
})