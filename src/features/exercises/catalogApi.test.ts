import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '../../api/http'
import { catalogApi } from './catalogApi'

vi.mock('../../api/http', () => ({ api: { get: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())

const exerciseId = '60fdbba6-0f4a-4dda-9332-f10a5e35ea55'
const equipmentId = 'aaf1b268-4315-41d4-b0a8-7d6f285d5280'
const metricId = 'f856aa4f-7b4f-4c81-886e-e825a301a3ad'
const propertyId = '13bc1bdd-6c55-48b3-8ac1-4a09fac569e7'
const equipment = {
  id: equipmentId, name: 'Гиря', imageUrl: null,
  equipmentProperties: [{ id: propertyId, name: 'Вес', metricsValueType: 'FLOAT', unit: 'кг' }],
}
const dto = {
  id: exerciseId, name: 'Махи гирей', description: 'Полное описание упражнения', category: 'STRENGTH',
  imageUrl: 'https://storage.test/image.png', videoUrl: 'https://storage.test/video.mp4',
  exercisesMetrics: [{ id: metricId, name: 'Повторения', metricsValueType: 'INTEGER', unit: 'раз' }],
  exerciseEquipments: [equipment],
}
const signal = () => new AbortController().signal

it('отправляет совместные фильтры по контракту каталога и сохраняет серверные ID и параметры', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [dto] })
  const requestSignal = signal()
  const result = await catalogApi.search({ query: ' махи ', category: 'STRENGTH', equipment: equipmentId }, requestSignal)
  expect(api.get).toHaveBeenCalledWith('/v1/general-exercises/catalog', {
    params: { name: 'махи', category: 'STRENGTH', equipmentId }, signal: requestSignal,
  })
  expect(result).toEqual([{
    id: exerciseId, name: dto.name, description: dto.description, category: 'Силовые', equipment: 'Гиря',
    imageUrl: dto.imageUrl, videoUrl: dto.videoUrl,
    parameters: [{ id: metricId, name: 'Повторения', valueType: 'INTEGER', unit: 'раз' }],
    equipmentDetails: [{ id: equipmentId, name: 'Гиря', parameters: [{ id: propertyId, name: 'Вес', valueType: 'DECIMAL', unit: 'кг' }] }],
  }])
})

it('не отправляет значения all и пустой поиск в API', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [] })
  const requestSignal = signal()
  await expect(catalogApi.search({ query: '  ', category: 'all', equipment: 'all' }, requestSignal)).resolves.toEqual([])
  expect(api.get).toHaveBeenCalledWith('/v1/general-exercises/catalog', { params: {}, signal: requestSignal })
})

it('использует UUID оборудования в фильтре, показывая пользователю название', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [equipment] })
  const requestSignal = signal()
  const filters = await catalogApi.getFilters(requestSignal)
  expect(api.get).toHaveBeenCalledWith('/v1/general-exercises/get/equipments', { signal: requestSignal })
  expect(filters.equipment).toEqual([{ value: equipmentId, label: 'Гиря' }])
  expect(filters.categories).toContainEqual({ value: 'STRENGTH', label: 'Силовые' })
})

it('получает подробности отдельным запросом по ID', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: dto })
  const requestSignal = signal()
  const result = await catalogApi.getExercise(exerciseId, requestSignal)
  expect(api.get).toHaveBeenCalledWith('/v1/general-exercises/' + exerciseId, { signal: requestSignal })
  expect(result.parameters?.[0].id).toBe(metricId)
})

it('принимает упражнение без медиа, оборудования и метрик', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { ...dto, imageUrl: null, videoUrl: null, exercisesMetrics: [], exerciseEquipments: [] } })
  const result = await catalogApi.getExercise(exerciseId, signal())
  expect(result).toMatchObject({ id: exerciseId, equipment: 'Без оборудования', parameters: [], equipmentDetails: [] })
  expect(result.imageUrl).toBeUndefined()
  expect(result.videoUrl).toBeUndefined()
})

it('не подменяет ошибку сервера моковым каталогом', async () => {
  vi.mocked(api.get).mockRejectedValue(new Error('HTTP 503'))
  await expect(catalogApi.search({ query: '', category: 'all', equipment: 'all' }, signal())).rejects.toThrow('HTTP 503')
})

it('отклоняет некорректный ответ вместо потери ID или типа параметра', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [{ ...dto, id: undefined }] })
  await expect(catalogApi.search({ query: '', category: 'all', equipment: 'all' }, signal())).rejects.toThrow('некорректный каталог')
})
