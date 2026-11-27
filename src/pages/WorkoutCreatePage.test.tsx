import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it } from 'vitest'
import { resetWorkoutDraft } from '../features/workouts/workoutDraft'
import { WorkoutCreatePage } from './WorkoutCreatePage'

beforeEach(() => resetWorkoutDraft())

it('кнопка сохранения неактивна до заполнения WOD', () => {
  render(
    <MemoryRouter>
      <WorkoutCreatePage />
    </MemoryRouter>,
  )
  expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  expect(screen.getByText(/этап WOD/i)).toBeInTheDocument()
})