import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CreateWorkoutError } from '../features/workouts/createWorkoutTypes'
import { findCatalogItem, defaultParamsForCatalogItem } from '../features/workouts/workoutFormatCatalog'
import { patchWorkoutDraft, patchWorkoutStage, resetWorkoutDraft } from '../features/workouts/workoutDraft'
import { WOD_STAGE_INDEX } from '../features/workouts/workoutStageParams'
import { WorkoutFormPage } from './WorkoutFormPage'

const workoutId = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
const updateOwnWorkout = vi.fn()
const onReloadFromServer = vi.fn()

vi.mock('../app/auth/useAuth', () => ({
  useAuth: () => ({ signOut: vi.fn(), user: { id: 'a' }, activeRole: 'ATHLETE' }),
}))

beforeEach(() => {
  resetWorkoutDraft()
  updateOwnWorkout.mockReset()
  onReloadFromServer.mockReset()
  const amrap = findCatalogItem('AMRAP')!
  patchWorkoutDraft({ datetime: new Date().toISOString(), name: 'Черновик' })
  patchWorkoutStage(WOD_STAGE_INDEX, {
    format: 'AMRAP',
    stageFormatId: amrap.stageFormatId,
    params: defaultParamsForCatalogItem(amrap),
    round: [{ key: '1', exerciseId: 'burpee' }],
  })
})

const renderEditForm = () => render(
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter initialEntries={[`/workouts/${workoutId}/edit`]}>
      <Routes>
        <Route
          path="/workouts/:workoutId/edit"
          element={(
            <WorkoutFormPage
              mode="edit"
              workoutId={workoutId}
              heading="Редактирование"
              cancelTo={`/workouts/${workoutId}`}
              updateApi={{ updateOwnWorkout }}
              onReloadFromServer={onReloadFromServer}
            />
          )}
        />
        <Route path={`/workouts/${workoutId}`} element={<p>Карточка</p>} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
)

it('отмена ведёт на карточку без запроса к API', async () => {
  const user = userEvent.setup()
  renderEditForm()
  await user.click(screen.getByRole('link', { name: 'Отменить' }))
  expect(await screen.findByText('Карточка')).toBeInTheDocument()
  expect(updateOwnWorkout).not.toHaveBeenCalled()
})

it('ошибка 403 не очищает форму и предлагает перезагрузку', async () => {
  updateOwnWorkout.mockRejectedValue(new CreateWorkoutError(403, 'Редактирование недоступно'))
  const user = userEvent.setup()
  renderEditForm()
  await user.click(screen.getByRole('button', { name: 'Сохранить' }))
  expect(await screen.findByText(/Загрузить актуальные данные/)).toBeInTheDocument()
  expect(screen.getByDisplayValue('Черновик')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Загрузить актуальные данные' }))
  expect(onReloadFromServer).toHaveBeenCalledTimes(1)
})