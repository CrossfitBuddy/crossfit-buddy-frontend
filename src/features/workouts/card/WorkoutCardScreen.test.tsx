import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { WorkoutCardScreen } from './WorkoutCardScreen'
import type { WorkoutCardApi, WorkoutDetails } from './types'

const workout: WorkoutDetails = {
  id: 'w1',
  title: 'Fran',
  description: 'Классический комплекс',
  durationSeconds: 1800,
  stages: [
    {
      id: 's1',
      format: 'Разминка',
      complexFormat: 'AMRAP',
      timeLimitSeconds: 300,
      targetRounds: null,
      intervalSeconds: null,
      rounds: [{
        id: 'r1',
        position: 1,
        repeatCount: 2,
        exercises: [{ id: 'e1', position: 1, name: 'Скакалка', repetitions: 50, weightKg: null, durationSeconds: null, distanceMeters: null, heightCm: null, notes: null }],
      }],
    },
    {
      id: 's2',
      format: 'Основной блок',
      complexFormat: 'For Time',
      timeLimitSeconds: 900,
      targetRounds: 3,
      intervalSeconds: 60,
      rounds: [{
        id: 'r2',
        position: 1,
        repeatCount: 1,
        exercises: [
          { id: 'e2', position: 1, name: 'Трастеры', repetitions: 21, weightKg: 43, durationSeconds: null, distanceMeters: null, heightCm: null, notes: 'Без пауз' },
          { id: 'e3', position: 2, name: 'Подтягивания', repetitions: 21, weightKg: null, durationSeconds: null, distanceMeters: null, heightCm: null, notes: null },
        ],
      }],
    },
  ],
  materials: [
    { type: 'VIDEO', title: 'Техника трастера', url: 'https://example.com/video' },
    { type: 'LINK', title: 'Опасная ссылка', url: 'javascript:alert(1)' },
  ],
}

const httpError = (status: number) => new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, { status } as never)

function renderCard(api: WorkoutCardApi, onSessionExpired = vi.fn()) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <WorkoutCardScreen id="w1" accountKey="user:ATHLETE" onSessionExpired={onSessionExpired} api={api} />
    </QueryClientProvider>,
  )
}

describe('Карточка тренировки', () => {
  it('показывает название, формат, длительность, этапы, раунды и упражнения', async () => {
    renderCard({ getWorkout: vi.fn().mockResolvedValue(workout) })

    expect(await screen.findByRole('heading', { name: 'Fran' })).toBeInTheDocument()
    expect(screen.getByText('AMRAP, For Time')).toBeInTheDocument()
    expect(screen.getByText('30 мин')).toBeInTheDocument()

    const warmup = screen.getByRole('region', { name: 'Разминка' })
    expect(within(warmup).getByText('AMRAP · Время: 5:00')).toBeInTheDocument()
    expect(within(warmup).getByText(/повторений раунда: 2/)).toBeInTheDocument()
    expect(within(warmup).getByText('1. Скакалка')).toBeInTheDocument()

    const main = screen.getByRole('region', { name: 'Основной блок' })
    expect(within(main).getByText('For Time · Время: 15:00 · Раундов: 3 · Интервал: 1:00')).toBeInTheDocument()
    expect(within(main).getByText('21 повт. · 43 кг')).toBeInTheDocument()
    expect(within(main).getByText('Без пауз')).toBeInTheDocument()
    expect(within(main).getByText('2. Подтягивания')).toBeInTheDocument()
  })

  it('показывает материалы, а небезопасные ссылки выводит как текст', async () => {
    renderCard({ getWorkout: vi.fn().mockResolvedValue(workout) })

    const link = await screen.findByRole('link', { name: 'Техника трастера' })
    expect(link).toHaveAttribute('href', 'https://example.com/video')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('Опасная ссылка')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Опасная ссылка' })).not.toBeInTheDocument()
  })

  it('не показывает необязательные блоки, если их нет', async () => {
    renderCard({ getWorkout: vi.fn().mockResolvedValue({ ...workout, durationSeconds: null, materials: [], stages: [] }) })

    expect(await screen.findByRole('heading', { name: 'Fran' })).toBeInTheDocument()
    expect(screen.queryByText('Длительность:')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Дополнительные материалы' })).not.toBeInTheDocument()
    expect(screen.getByText('В тренировке пока нет этапов')).toBeInTheDocument()
  })

  it('не содержит действий редактирования, удаления и запуска', async () => {
    renderCard({ getWorkout: vi.fn().mockResolvedValue(workout) })

    await screen.findByRole('heading', { name: 'Fran' })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('на время загрузки показывает индикатор', () => {
    renderCard({ getWorkout: () => new Promise<WorkoutDetails>(() => {}) })

    expect(screen.getByRole('status')).toHaveTextContent('Загрузка тренировки')
  })

  it('показывает общее сообщение для отсутствующей и недоступной карточки', async () => {
    renderCard({ getWorkout: vi.fn().mockRejectedValue(httpError(404)) })

    expect(await screen.findByText('Тренировка не найдена или недоступна')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Повторить загрузку' })).not.toBeInTheDocument()
  })

  it('показывает отказ в доступе', async () => {
    renderCard({ getWorkout: vi.fn().mockRejectedValue(httpError(403)) })

    expect(await screen.findByText('Нет доступа к этой тренировке')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Fran' })).not.toBeInTheDocument()
  })

  it('показывает ошибку некорректного идентификатора', async () => {
    renderCard({ getWorkout: vi.fn().mockRejectedValue(httpError(400)) })

    expect(await screen.findByText('Некорректная ссылка на тренировку')).toBeInTheDocument()
  })

  it('завершает сессию при 401', async () => {
    const onSessionExpired = vi.fn()
    renderCard({ getWorkout: vi.fn().mockRejectedValue(httpError(401)) }, onSessionExpired)

    expect(await screen.findByText('Сессия истекла. Войдите снова.')).toBeInTheDocument()
    expect(onSessionExpired).toHaveBeenCalledOnce()
  })

  it('при другой ошибке даёт повторить загрузку', async () => {
    const getWorkout = vi.fn().mockRejectedValueOnce(httpError(500)).mockResolvedValueOnce(workout)
    const user = userEvent.setup()
    renderCard({ getWorkout })

    expect(await screen.findByText('Не удалось загрузить тренировку')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку' }))

    expect(await screen.findByRole('heading', { name: 'Fran' })).toBeInTheDocument()
    expect(getWorkout).toHaveBeenCalledTimes(2)
  })
})
