import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { WorkoutDetailPage } from '../../pages/WorkoutDetailPage'
import { ExerciseCatalog } from '../exercises/ExerciseCatalog'
import { mockCatalogApi } from '../exercises/mockCatalogApi'
import { resetCatalogSearch } from '../exercises/catalogSearch'
import { RoundRoute } from '../exercises/RoundRoute'
import { resetSelection } from '../exercises/selection'
import { WorkoutCreatePage } from '../../pages/WorkoutCreatePage'
import { findCatalogItem, defaultParamsForCatalogItem } from './workoutFormatCatalog'
import { getWorkoutDraft, patchWorkoutDraft, patchWorkoutStage, resetWorkoutDraft } from './workoutDraft'
import type { CreateOwnWorkoutApi } from './createOwnWorkoutApi'

const createOwnWorkout = vi.fn<CreateOwnWorkoutApi['createOwnWorkout']>()
const workoutId = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

vi.mock('../../app/auth/useAuth', () => ({
  useAuth: () => ({ signOut: vi.fn(), user: { id: 'trainer' }, activeRole: 'ATHLETE' }),
}))
vi.mock('../../api/http', () => ({ api: { get: vi.fn() } }))

beforeEach(() => {
  resetWorkoutDraft()
  resetSelection()
  resetCatalogSearch()
  createOwnWorkout.mockReset()
  createOwnWorkout.mockResolvedValue({ id: workoutId })
})

async function renderCreateFlow(path = '/workouts/new') {
  const { api } = await import('../../api/http')
  vi.mocked(api.get).mockResolvedValue({ data: { id: workoutId, name: 'Тест плана' } })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/workouts/new" element={<WorkoutCreatePage createApi={{ createOwnWorkout }} />} />
          <Route path="/exercises" element={<ExerciseCatalog api={mockCatalogApi} />} />
          <Route path="/round" element={<RoundRoute />} />
          <Route path="/workouts/:workoutId" element={<WorkoutDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function selectFormat(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: label }))
  const items = await screen.findAllByTitle(option)
  await user.click(items[items.length - 1])
}

it('сквозной: WOD AMRAP → раунд → возврат → Сохранить активна', async () => {
  const user = userEvent.setup()
  await renderCreateFlow()

  await user.type(screen.getByLabelText('Название'), 'Тест плана')
  await selectFormat(user, 'Формат: WOD', 'AMRAP')

  const wod = screen.getByRole('region', { name: /WOD/i })
  await user.click(within(wod).getByRole('button', { name: 'Собрать раунд' }))

  await user.click(screen.getByRole('button', { name: 'Выбрать Берпи' }))
  await user.click(screen.getByRole('button', { name: 'Готово' }))

  expect(screen.getByRole('heading', { name: 'Раунд' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Готово' }))

  expect(screen.getByRole('heading', { name: 'Новая тренировка' })).toBeInTheDocument()
  expect(screen.getByDisplayValue('Тест плана')).toBeInTheDocument()
  expect(within(screen.getByRole('region', { name: /WOD/i })).getByText('Берпи')).toBeInTheDocument()

  const save = screen.getByRole('button', { name: 'Сохранить' })
  expect(save).toBeEnabled()
  await user.click(save)
  expect(await screen.findByText(/тренировка создана/i)).toBeInTheDocument()
  expect(createOwnWorkout).toHaveBeenCalledTimes(1)
  expect(await screen.findByRole('heading', { name: 'Тест плана' })).toBeInTheDocument()
})

it('показывает ошибки полей с бэка без сброса черновика', async () => {
  const user = userEvent.setup()
  const { CreateWorkoutError } = await import('./createWorkoutTypes')
  createOwnWorkout.mockRejectedValueOnce(new CreateWorkoutError(400, 'Некорректные данные', 'VALIDATION_ERROR', [{
    field: 'stages[2].timeLimitSeconds',
    code: 'REQUIRED_PARAMETER',
    message: 'Нужна длительность',
  }]))
  await renderCreateFlow()

  await selectFormat(user, 'Формат: WOD', 'AMRAP')
  const wod = screen.getByRole('region', { name: /WOD/i })
  await user.click(within(wod).getByRole('button', { name: 'Собрать раунд' }))
  await user.click(screen.getByRole('button', { name: 'Выбрать Берпи' }))
  await user.click(screen.getByRole('button', { name: 'Готово' }))
  await user.click(screen.getByRole('button', { name: 'Готово' }))

  await user.type(screen.getByLabelText('Название'), 'Сохранить после ошибки')
  await user.click(screen.getByRole('button', { name: 'Сохранить' }))
  expect(await screen.findByText(/WOD: длительность/i)).toBeInTheDocument()
  expect(screen.getByDisplayValue('Сохранить после ошибки')).toBeInTheDocument()
})

it('возврат из раунда не сбрасывает другой этап', async () => {
  const user = userEvent.setup()
  const amrap = findCatalogItem('AMRAP')!
  patchWorkoutDraft({ datetime: new Date().toISOString(), name: 'Сохранить разминку' })
  patchWorkoutStage(0, {
    format: 'AMRAP',
    params: defaultParamsForCatalogItem(amrap),
    round: [{ key: 'w', exerciseId: 'plank', parameters: {} }],
  })

  await renderCreateFlow()

  expect(screen.getByText('Планка')).toBeInTheDocument()

  await selectFormat(user, 'Формат: WOD', 'AMRAP')
  await user.click(within(screen.getByRole('region', { name: /WOD/i })).getByRole('button', { name: 'Собрать раунд' }))
  await user.click(screen.getByRole('button', { name: 'Выбрать Берпи' }))
  await user.click(screen.getByRole('button', { name: 'Готово' }))
  await user.click(screen.getByRole('button', { name: 'Готово' }))

  expect(within(screen.getByRole('region', { name: 'Разминка' })).getByText('Планка')).toBeInTheDocument()
  expect(getWorkoutDraft().stages[0].round[0].exerciseId).toBe('plank')
})