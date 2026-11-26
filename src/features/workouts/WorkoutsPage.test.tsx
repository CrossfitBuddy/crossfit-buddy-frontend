import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { WorkoutsPage } from './WorkoutsPage'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../../api/http', () => ({ api: { get } }))
vi.mock('../../app/auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 'athlete' }, activeRole: 'ATHLETE', signOut: vi.fn() }),
}))

const workout = {
  id: '2dd94fa9-1763-4986-82a5-6752d0a3da96',
  title: 'Fran',
  date: '2026-11-15T13:30:00Z',
  status: 'READY',
  source: 'OWN',
}

function renderWorkouts(path = '/workouts') {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/workouts/:workoutId" element={<WorkoutsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  get.mockReset()
})

it('отправляет поиск и фильтры вместе и сбрасывает страницу при смене условий', async () => {
  get.mockImplementation(async (_path, { params }) => ({
    data: { items: params.q ? [] : [workout], page: params.page, totalPages: params.q ? 0 : 2 },
  }))
  const user = userEvent.setup()
  renderWorkouts()
  await screen.findByRole('heading', { name: 'Fran' })
  await user.click(screen.getByRole('button', { name: 'Дальше' }))
  await screen.findByText('Страница 2')
  await user.selectOptions(screen.getByLabelText('Источник'), 'ASSIGNED')
  await user.selectOptions(screen.getByLabelText('Статус'), 'READY')
  fireEvent.change(screen.getByLabelText('Дата создания (UTC)'), { target: { value: '2026-11-15' } })
  await user.type(screen.getByRole('searchbox'), '  Cindy  ')

  await screen.findByText('По заданным условиям ничего не найдено')
  expect(get).toHaveBeenLastCalledWith('/v1/workouts', {
    params: {
      q: 'Cindy', source: 'ASSIGNED', status: 'READY',
      dateFrom: '2026-11-15', dateTo: '2026-11-15', page: 0,
    },
    signal: expect.any(AbortSignal),
  })
})

it('убирает карточки при отказе в доступе к списку', async () => {
  get.mockResolvedValueOnce({ data: { items: [workout], page: 0, totalPages: 1 } })
    .mockRejectedValueOnce({ isAxiosError: true, response: { status: 403 } })
  const user = userEvent.setup()
  renderWorkouts()
  await screen.findByRole('heading', { name: 'Fran' })
  await user.selectOptions(screen.getByLabelText('Статус'), 'CANCELLED')
  expect(await screen.findByRole('alert')).toHaveTextContent('У вас нет доступа к списку тренировок.')
  expect(screen.queryByRole('heading', { name: 'Fran' })).not.toBeInTheDocument()
})

it('передаёт UUID из списка в запрос подробной карточки', async () => {
  get.mockResolvedValueOnce({ data: { items: [workout], page: 0, totalPages: 1 } })
    .mockResolvedValueOnce({ data: {
      id: workout.id, title: workout.title, durationSec: 900,
      complexes: [{ id: 'stage', workoutStage: 'Основной блок', complexFormat: 'For Time', rounds: [] }],
    } })

  const user = userEvent.setup()
  renderWorkouts()
  await user.click(await screen.findByRole('link', { name: /Fran/ }))

  expect(await screen.findByRole('heading', { name: 'Основной блок' })).toBeInTheDocument()
  expect(screen.getByText('15 мин')).toBeInTheDocument()
  expect(get).toHaveBeenLastCalledWith(`/v1/workouts/${workout.id}`, { signal: expect.any(AbortSignal) })
})

it('позволяет открыть карточку напрямую после отказа в доступе к списку', async () => {
  get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 403 } })
    .mockResolvedValueOnce({ data: {
      id: workout.id, title: workout.title, durationSec: 900,
      complexes: [{ id: 'stage', workoutStage: 'WOD', complexFormat: 'FOR_TIME', rounds: [] }],
    } })

  const list = renderWorkouts()
  expect(await screen.findByRole('alert')).toHaveTextContent('У вас нет доступа к списку тренировок.')
  list.unmount()
  renderWorkouts(`/workouts/${workout.id}`)

  expect(await screen.findByRole('heading', { name: 'WOD' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Fran' })).toBeInTheDocument()
  expect(get).toHaveBeenCalledTimes(2)
  expect(get).toHaveBeenLastCalledWith(`/v1/workouts/${workout.id}`, { signal: expect.any(AbortSignal) })
})
