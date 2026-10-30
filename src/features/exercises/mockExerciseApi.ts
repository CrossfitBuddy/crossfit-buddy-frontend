import type { Exercise, ExerciseApi, ExerciseCatalog } from './types'

export const demoExerciseId = '7d3c2a10-5b1e-4f0a-9c61-2f8e4b6a9d01'

export const demoExercise: Exercise = {
  name: 'Свинг гири',
  description: 'Мах гирей двумя руками от бёдер до уровня груди за счёт разгибания таза.',
  media: [],
  metrics: [
    { name: 'Количество повторений', valueType: 'INTEGER', unit: 'раз' },
  ],
  equipment: [
    {
      name: 'Гиря',
      image: [],
      properties: [{ name: 'Вес', valueType: 'INTEGER', unit: 'кг' }],
    },
  ],
}

export const exerciseCatalog: ExerciseCatalog = {
  metrics: [
    { name: 'Количество повторений', valueType: 'INTEGER', unit: 'раз' },
    { name: 'Вес', valueType: 'DECIMAL', unit: 'кг' },
    { name: 'Время', valueType: 'INTEGER', unit: 'сек' },
    { name: 'Дистанция', valueType: 'DECIMAL', unit: 'м' },
  ],
  equipment: ['Гиря', 'Штанга', 'Гантели', 'Скакалка', 'Турник'],
}

export function createMockExerciseApi(delay = 400): ExerciseApi {
  const exercises = new Map<string, Exercise>([[demoExerciseId, structuredClone(demoExercise)]])
  const wait = () => new Promise<void>((resolve) => setTimeout(resolve, delay))

  return {
    async getExercise(id) {
      await wait()
      const exercise = exercises.get(id)
      if (!exercise) throw new Error('NOT_FOUND')
      return structuredClone(exercise)
    },
    async getCatalog() {
      await wait()
      return structuredClone(exerciseCatalog)
    },
    async saveExercise(exercise, id) {
      await wait()
      exercises.set(id ?? crypto.randomUUID(), structuredClone(exercise))
    },
  }
}

export const exerciseApi = createMockExerciseApi()
