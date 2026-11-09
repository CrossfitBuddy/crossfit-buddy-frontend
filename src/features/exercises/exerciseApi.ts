import { isAxiosError } from 'axios'
import { api } from '../../api/http'
import type { Equipment, Exercise, ExerciseApi, Measure } from './types'

const root = '/v1/general-exercises'

type MeasureDto = { id: string; name: string; metricsValueType: 'INTEGER' | 'FLOAT'; unit: string }
type EquipmentDto = { id: string; name: string; equipmentProperties: MeasureDto[] }
type ExerciseDto = {
  id: string
  name: string
  description: string
  category: string
  exercisesMetrics: MeasureDto[]
  exerciseEquipments: EquipmentDto[]
}

const measure = (dto: MeasureDto): Measure => ({
  id: dto.id, name: dto.name, unit: dto.unit, valueType: dto.metricsValueType === 'FLOAT' ? 'DECIMAL' : 'INTEGER',
})

const equipment = (dto: EquipmentDto): Equipment => ({
  id: dto.id, name: dto.name, properties: (dto.equipmentProperties ?? []).map(measure), image: [],
})

export function exerciseError(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    return typeof message === 'string' ? message : undefined
  }
  return error instanceof Error ? error.message : undefined
}

function createRequest(value: Exercise) {
  if (value.media.length || value.equipment.some(item => item.image.length)) {
    throw new Error('Загрузка изображений пока недоступна. Чтобы сохранить упражнение без изображений, удалите выбранные файлы.')
  }
  const data = new FormData()
  data.set('name', value.name)
  data.set('description', value.description)
  data.set('category', value.category)
  const addMeasure = (prefix: string, item: Measure) => {
    data.set(prefix + '.name', item.name)
    data.set(prefix + '.metricsValueType', item.valueType === 'DECIMAL' ? 'FLOAT' : 'INTEGER')
    data.set(prefix + '.unit', item.unit)
  }
  // Spring binds an empty form value to an empty collection; omitted record fields can be null.
  if (!value.metrics.length) data.set('exercisesMetrics', '')
  if (!value.equipment.length) data.set('exercisesEquipments', '')
  value.metrics.forEach((item, index) => {
    const prefix = 'exercisesMetrics[' + index + ']'
    if (item.id) data.set(prefix + '.id', item.id)
    addMeasure(prefix, item)
  })
  value.equipment.forEach((item, index) => {
    const prefix = 'exercisesEquipments[' + index + ']'
    if (item.id) data.set(prefix + '.id', item.id)
    data.set(prefix + '.name', item.name)
    if (!item.properties.length) data.set(prefix + '.propertiesRequests', '')
    item.properties.forEach((property, i) => addMeasure(prefix + '.propertiesRequests[' + i + ']', property))
  })
  return data
}

export const exerciseApi: ExerciseApi = {
  async getCatalog() {
    const [metrics, items] = await Promise.all([
      api.get<MeasureDto[]>(root + '/get/metrics'),
      api.get<EquipmentDto[]>(root + '/get/equipments'),
    ])
    return { metrics: metrics.data.map(measure), equipment: items.data.map(equipment) }
  },
  async getExercise(id) {
    const { data } = await api.get<ExerciseDto[]>(root + '/get/all-exercises')
    const item = data.find(entry => entry.id === id)
    if (!item) throw new Error('Упражнение не найдено')
    return { name: item.name, description: item.description, category: item.category,
      metrics: (item.exercisesMetrics ?? []).map(measure), equipment: (item.exerciseEquipments ?? []).map(equipment), media: [] }
  },
  async saveExercise(value, id) {
    if (id) throw new Error('Сервер пока не поддерживает сохранение изменений упражнения')
    await api.post(root + '/set', createRequest(value))
  },
}
