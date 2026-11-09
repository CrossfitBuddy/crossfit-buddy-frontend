import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '../../api/http'
import { exerciseApi } from './exerciseApi'
import { demoExercise } from './mockExerciseApi'

vi.mock('../../api/http', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())

it('отправляет только оставшиеся строки формы с именами и типами полей бэкенда', async () => {
  await exerciseApi.saveExercise({ ...demoExercise,
    metrics: [{ id: 'm1', name: 'Вес', unit: 'кг', valueType: 'DECIMAL' }],
  })
  const [path, body] = vi.mocked(api.post).mock.calls[0]
  expect(path).toBe('/v1/general-exercises/set')
  expect(Object.fromEntries((body as FormData).entries())).toMatchObject({
    category: 'STRENGTH',
    'exercisesMetrics[0].id': 'm1',
    'exercisesMetrics[0].metricsValueType': 'FLOAT',
    'exercisesEquipments[0].propertiesRequests[0].name': 'Вес',
  })
})

it('открывает нужное упражнение из списка и не создаёт копию при редактировании', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [{ id: 'other' }, {
    id: 'wanted', name: 'Прыжок', description: 'Прыжок в длину', category: 'CARDIO',
    exercisesMetrics: [], exerciseEquipments: [],
  }] })
  const item = await exerciseApi.getExercise('wanted')
  expect(item.name).toBe('Прыжок')
  await expect(exerciseApi.saveExercise(item, 'wanted')).rejects.toThrow('сохранение изменений')
  expect(api.post).not.toHaveBeenCalled()
})
