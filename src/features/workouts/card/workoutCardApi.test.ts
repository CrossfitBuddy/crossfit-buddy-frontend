import { describe, expect, it } from 'vitest'
import { parseWorkout } from './workoutCardApi'

const exercise = { exerciseId: 'e1', name: 'Приседания', repetitions: 10 }

describe('parseWorkout', () => {
  it('разбирает этапы, раунды и упражнения и сортирует раунды по порядку', () => {
    const workout = parseWorkout({
      id: 'w1',
      title: 'Fran',
      stages: [{
        id: 's1',
        name: 'Основной блок',
        format: { name: 'For Time' },
        timeLimitSeconds: 900,
        rounds: [
          { position: 2, repeatCount: 3, exercises: [exercise] },
          { position: 1, exercises: [exercise] },
        ],
      }],
    })

    expect(workout.stages[0].formatName).toBe('For Time')
    expect(workout.stages[0].rounds.map((round) => round.position)).toEqual([1, 2])
    expect(workout.stages[0].rounds[0].repeatCount).toBe(1)
    expect(workout.stages[0].rounds[1].exercises[0]).toMatchObject({ name: 'Приседания', repetitions: 10, weightKg: null })
  })

  it('необязательные поля и материалы по умолчанию пустые', () => {
    const workout = parseWorkout({ id: 'w1', title: 'Пустая' })

    expect(workout).toMatchObject({ description: null, startsAt: null, durationSeconds: null, stages: [], materials: [] })
  })

  it('отклоняет ответ неверной формы', () => {
    expect(() => parseWorkout({ title: 'Без id' })).toThrow('Сервер вернул некорректную карточку тренировки')
    expect(() => parseWorkout({ id: 'w1', title: 'Т', materials: [{ type: 'GIF', title: 'x', url: 'u' }] })).toThrow()
  })
})
