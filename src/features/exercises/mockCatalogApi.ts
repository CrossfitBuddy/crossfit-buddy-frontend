import { exerciseCategories, exerciseEquipment, exercises, filterExercises } from './catalog'
import type { CatalogApi } from './catalogApi'

// Данные для компонентных проверок каталога.
export const mockCatalogApi: CatalogApi = {
  async getFilters(signal) {
    signal.throwIfAborted()
    return {
      categories: exerciseCategories.map(value => ({ value, label: value })),
      equipment: exerciseEquipment.map(value => ({ value, label: value })),
    }
  },
  async search({ query, category, equipment }, signal) {
    signal.throwIfAborted()
    return filterExercises(exercises, query, category, equipment)
  },
  async getExercise(id, signal) {
    signal.throwIfAborted()
    const exercise = exercises.find(item => item.id === id)
    if (!exercise) throw new Error('Упражнение не найдено')
    return exercise
  },
}
