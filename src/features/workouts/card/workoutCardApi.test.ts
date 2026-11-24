import { describe, expect, it } from 'vitest'
import { parseWorkout } from './workoutCardApi'

const exercise = { id: 'e1', position: 1, name: 'Приседания', repetitions: 10 }

describe('parseWorkout', () => {
  it('разбирает этапы, раунды и упражнения и сортирует раунды по порядку', () => {
    const workout = parseWorkout({
      id: 'w1',
      title: 'Fran',
      durationSec: 900,
      type: 'OWN',
      status: 'READY',
      complexes: [{
        id: 's1',
        workoutStage: 'Основной блок',
        complexFormat: 'FOR_TIME',
        timeLimitSeconds: 900,
        rounds: [
          { id: 'r2', position: 2, repeatCount: 3, exercises: [{ ...exercise, position: 2, weightKg: 12.5 }, exercise] },
          { id: 'r1', position: 1, repeatCount: 1, exercises: [exercise] },
        ],
      }],
      materials: [{ type: 'VIDEO', title: 'Демонстрация', url: 'https://example.com/video' }],
    })

    expect(workout.durationSeconds).toBe(900)
    expect(workout.stages[0]).toMatchObject({ format: 'Основной блок', complexFormat: 'FOR_TIME' })
    expect(workout.stages[0].rounds.map((round) => round.position)).toEqual([1, 2])
    expect(workout.stages[0].rounds[0].repeatCount).toBe(1)
    expect(workout.stages[0].rounds[1].exercises[0]).toMatchObject({ name: 'Приседания', repetitions: 10, weightKg: null })
    expect(workout.stages[0].rounds[1].exercises.map((item) => item.position)).toEqual([1, 2])
    expect(workout.stages[0].rounds[1].exercises[1].weightKg).toBe(12.5)
    expect(workout.materials[0].title).toBe('Демонстрация')
  })

  it('необязательные поля и материалы по умолчанию пустые', () => {
    const workout = parseWorkout({ id: 'w1', title: null, complexes: [] })

    expect(workout).toMatchObject({ title: 'Тренировка без названия', description: null, durationSeconds: null, stages: [], materials: [] })
  })

  it('отклоняет ответ неверной формы', () => {
    expect(() => parseWorkout({ title: 'Без id' })).toThrow('Сервер вернул некорректную карточку тренировки')
    expect(() => parseWorkout({ id: 'w1', title: 'Т', stages: [] })).toThrow()
    expect(() => parseWorkout({ id: 'w1', title: 'Т', complexes: [{ id: 's1', workoutStage: { name: 'AMRAP' } }] })).toThrow()
  })
})
