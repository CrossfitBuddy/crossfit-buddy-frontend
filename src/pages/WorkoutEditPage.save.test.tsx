import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { findCatalogItem, defaultParamsForCatalogItem } from '../features/workouts/workoutFormatCatalog'
import type { WorkoutDraft } from '../features/workouts/workoutDraft'
import { WOD_STAGE_INDEX } from '../features/workouts/workoutStageParams'
import { WorkoutEditPage } from './WorkoutEditPage'

const workoutId = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
const fetchOwnWorkout = vi.fn<(id: string) => Promise<WorkoutDraft>>()
const updateOwnWorkout = vi.fn()

vi.mock('../app/auth/useAuth', () => ({
  useAuth: () => ({ signOut: vi.fn(), user: { id: 'a' }, activeRole: 'ATHLETE' }),
}))

beforeEach(() => {
  fetchOwnWorkout.mockReset()
  updateOwnWorkout.mockReset()
  const amrap = findCatalogItem('AMRAP')!
  fetchOwnWorkout.mockResolvedValue({
    name: 'Из API',
    description: '',
    datetime: new Date().toISOString(),
    durationMinutes: 45,
    stages: [
      { workoutStageId: 1, format: null, params: {}, round: [] },
      { workoutStageId: 2, format: null, params: {}, round: [] },
      {
        workoutStageId: WOD_STAGE_INDEX + 1,
        format: 'AMRAP',
        params: defaultParamsForCatalogItem(amrap),
        round: [{ key: '1', exerciseId: 'burpee', parameters: {} }],
      },
      { workoutStageId: 4, format: null, params: {}, round: [] },
    ],
  })
})

it('грузит тренировку и сохраняет изменения', async () => {
  updateOwnWorkout.mockResolvedValue({ id: workoutId })
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[`/workouts/${workoutId}/edit`]}>
        <Routes>
          <Route path="/workouts/:workoutId/edit" element={(
            <WorkoutEditPage fetchApi={{ fetchOwnWorkout }} updateApi={{ updateOwnWorkout }} />
          )} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  expect(await screen.findByDisplayValue('Из API')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Сохранить' }))
  await waitFor(() => expect(updateOwnWorkout).toHaveBeenCalledTimes(1))
  expect(updateOwnWorkout.mock.calls[0]?.[0]).toBe(workoutId)
})