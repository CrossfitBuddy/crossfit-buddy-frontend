import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { resetWorkoutDraft } from '../features/workouts/workoutDraft'
import { WorkoutCreatePage } from './WorkoutCreatePage'

vi.mock('../app/auth/useAuth', () => ({
  useAuth: () => ({ signOut: vi.fn(), user: { id: 'trainer' }, activeRole: 'TRAINER' }),
}))

beforeEach(() => resetWorkoutDraft())

it('кнопка сохранения неактивна до заполнения WOD', () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <WorkoutCreatePage createApi={{ createOwnWorkout: vi.fn() }} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  expect(screen.getByText(/этап WOD/i)).toBeInTheDocument()
})