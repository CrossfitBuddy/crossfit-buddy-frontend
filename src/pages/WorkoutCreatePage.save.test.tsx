import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { findCatalogItem, defaultParamsForCatalogItem } from '../features/workouts/workoutFormatCatalog'
import { CreateWorkoutError } from '../features/workouts/createWorkoutTypes'
import { patchWorkoutDraft, patchWorkoutStage, resetWorkoutDraft } from '../features/workouts/workoutDraft'
import { WOD_STAGE_INDEX } from '../features/workouts/workoutStageParams'
import { WorkoutCreatePage } from './WorkoutCreatePage'

const createOwnWorkout = vi.fn()

vi.mock('../app/auth/useAuth', () => ({
  useAuth: () => ({ signOut: vi.fn(), user: { id: 'a' }, activeRole: 'ATHLETE' }),
}))

beforeEach(() => {
  resetWorkoutDraft()
  createOwnWorkout.mockReset()
})

it('блокирует повторную отправку на время запроса', async () => {
  let finish: () => void = () => {}
  createOwnWorkout.mockImplementation(() => new Promise<{ id: string }>((resolve) => {
    finish = () => resolve({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  }))
  const amrap = findCatalogItem('AMRAP')!
  patchWorkoutDraft({ datetime: new Date().toISOString() })
  patchWorkoutStage(WOD_STAGE_INDEX, {
    format: 'AMRAP',
    params: defaultParamsForCatalogItem(amrap),
    round: [{ key: '1', exerciseId: 'burpee', parameters: {} }],
  })

  const user = userEvent.setup()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <WorkoutCreatePage createApi={{ createOwnWorkout }} />
      </MemoryRouter>
    </QueryClientProvider>,
  )

  const save = screen.getByRole('button', { name: 'Сохранить' })
  await user.click(save)
  expect(save).toBeDisabled()
  expect(createOwnWorkout).toHaveBeenCalledTimes(1)
  await user.click(save)
  expect(createOwnWorkout).toHaveBeenCalledTimes(1)
  finish()
})

it('рисует ошибки полей и не очищает форму', async () => {
  createOwnWorkout.mockRejectedValue(new CreateWorkoutError(400, 'bad', 'VALIDATION_ERROR', [{
    field: 'datetime',
    code: 'INVALID_VALUE',
    message: 'Нужна дата',
  }]))
  const amrap = findCatalogItem('AMRAP')!
  patchWorkoutDraft({ datetime: new Date().toISOString(), name: 'Мой черновик' })
  patchWorkoutStage(WOD_STAGE_INDEX, {
    format: 'AMRAP',
    params: defaultParamsForCatalogItem(amrap),
    round: [{ key: '1', exerciseId: 'burpee', parameters: {} }],
  })

  const user = userEvent.setup()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <WorkoutCreatePage createApi={{ createOwnWorkout }} />
      </MemoryRouter>
    </QueryClientProvider>,
  )

  await user.click(screen.getByRole('button', { name: 'Сохранить' }))
  expect(await screen.findByText(/Дата и время: Нужна дата/)).toBeInTheDocument()
  expect(screen.getByDisplayValue('Мой черновик')).toBeInTheDocument()
})