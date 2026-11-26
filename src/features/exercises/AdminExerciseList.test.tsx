import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '../../api/http'
import { appRoutes } from '../../app/routes'
import { RoleGate } from '../../app/RoleGate'
import type { UserRole } from '../../app/auth/types'
import { resetSelection } from './selection'

const auth = vi.hoisted(() => ({ role: 'ADMIN' as UserRole }))
vi.mock('../../app/auth/useAuth', () => ({ useAuth: () => ({ activeRole: auth.role }) }))
vi.mock('../../api/http', () => ({ api: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }))

const exerciseId = '60fdbba6-0f4a-4dda-9332-f10a5e35ea55'
const saved = { id: exerciseId, name: 'Берпи сервера', description: 'Описание сохранённого упражнения', category: 'CARDIO', exercisesMetrics: [], exerciseEquipments: [] }
let exercises = [saved]

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: 0 } } })
  render(<QueryClientProvider client={client}><AntApp><MemoryRouter initialEntries={['/exercises']}><Routes>
    {appRoutes.filter(route => route.path.startsWith('/exercises')).map(route =>
      <Route key={route.path} path={route.path} element={<RoleGate roles={route.roles}>{route.element}</RoleGate>} />)}
  </Routes></MemoryRouter></AntApp></QueryClientProvider>)
  return userEvent.setup()
}

beforeEach(() => {
  vi.resetAllMocks()
  auth.role = 'ADMIN'
  resetSelection()
  exercises = [{ ...saved }]
  vi.mocked(api.get).mockImplementation(async path => ({ data: ['/get/all-exercises', '/catalog'].some(suffix => String(path).endsWith(suffix)) ? exercises.map(item => ({ ...item })) : [] }))
  vi.mocked(api.post).mockImplementation(async (_path, request) => {
    const form = request as FormData
    exercises.push({ ...saved, id: 'aaf1b268-4315-41d4-b0a8-7d6f285d5280', name: String(form.get('name')), description: String(form.get('description')), category: String(form.get('category')) })
    return { data: undefined }
  })
  vi.mocked(api.put).mockImplementation(async (_path, request) => {
    const form = request as FormData
    exercises = exercises.map(item => item.id === form.get('id') ? { ...item, name: String(form.get('name')) } : item)
    return { data: undefined }
  })
})

it('открывает администратору серверный список вместо заглушки', async () => {
  setup()
  expect(await screen.findByRole('heading', { name: saved.name })).toBeInTheDocument()
  expect(api.get).toHaveBeenCalledWith('/v1/general-exercises/get/all-exercises', { signal: expect.any(AbortSignal) })
  expect(screen.getByRole('link', { name: 'Редактировать ' + saved.name })).toHaveAttribute('href', '/exercises/' + exerciseId + '/edit')
  expect(screen.getByText(saved.description)).toBeInTheDocument()
  expect(screen.queryByText('Раздел в разработке')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Готово' })).not.toBeInTheDocument()
})

it('показывает загрузку, затем пустой список с доступным созданием', async () => {
  let resolve!: (value: { data: [] }) => void
  vi.mocked(api.get).mockImplementationOnce(() => new Promise(done => { resolve = done }))
  setup()
  expect(screen.getByRole('status')).toHaveTextContent('Загрузка упражнений')
  expect(screen.queryByText('Упражнений пока нет')).not.toBeInTheDocument()
  await act(async () => resolve({ data: [] }))
  expect(await screen.findByText('Упражнений пока нет')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Создать упражнение' })).toBeEnabled()
})

it('показывает ошибку и повторно получает список', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('503'))
  const user = setup()
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить упражнения')
  await user.click(screen.getByRole('button', { name: 'Повторить загрузку' }))
  expect(await screen.findByRole('heading', { name: saved.name })).toBeInTheDocument()
})

it('обновляет закэшированный список после изменения имени без перезагрузки страницы', async () => {
  const user = setup()
  await user.click(await screen.findByRole('link', { name: 'Редактировать ' + saved.name }))
  const input = await screen.findByLabelText('Название')
  await user.clear(input)
  await user.type(input, 'Новое название')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Сохранить' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: 'Сохранить' }))
  expect(await screen.findByRole('heading', { name: 'Новое название' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: saved.name })).not.toBeInTheDocument()
})

it('показывает созданное упражнение после возвращения из формы', async () => {
  const user = setup()
  await screen.findByRole('heading', { name: saved.name })
  await user.click(screen.getByRole('button', { name: 'Создать упражнение' }))
  await user.type(await screen.findByLabelText('Название'), 'Приседания')
  await user.type(screen.getByLabelText('Описание'), 'Приседания с собственным весом')
  await user.selectOptions(screen.getByLabelText('Категория'), 'STRENGTH')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Сохранить' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: 'Сохранить' }))
  expect(await screen.findByRole('heading', { name: 'Приседания' })).toBeInTheDocument()
  expect(within(screen.getByRole('list', { name: 'Список упражнений' })).getAllByRole('listitem')).toHaveLength(2)
})

it('сохраняет metricCode при редактировании упражнения из списка администратора', async () => {
  const metric = { id: 'b4a5f43c-c5df-4c07-b6b7-cf2fc3b26e10', name: 'Повторения', metricsValueType: 'INTEGER', unit: 'раз', metricCode: 'repetitions' }
  vi.mocked(api.get).mockImplementation(async path => ({ data: String(path).endsWith('/get/all-exercises')
    ? [{ ...saved, exercisesMetrics: [metric] }]
    : String(path).endsWith('/get/metrics') ? [metric] : [] }))
  const user = setup()
  await user.click(await screen.findByRole('link', { name: 'Редактировать ' + saved.name }))
  const input = await screen.findByLabelText('Название')
  await user.clear(input)
  await user.type(input, 'Обновлённое название')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Сохранить' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: 'Сохранить' }))
  await waitFor(() => expect(api.put).toHaveBeenCalled())
  const request = vi.mocked(api.put).mock.calls[0][1] as FormData
  expect(request.get('exercisesMetrics[0].id')).toBe(metric.id)
  expect(request.get('exercisesMetrics[0].metricCode')).toBe('repetitions')
})

it.each(['ATHLETE', 'TRAINER'] as const)('сохраняет экран выбора для роли %s', async role => {
  auth.role = role
  setup()
  expect(await screen.findByRole('button', { name: 'Выбрать ' + saved.name })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Создать упражнение' })).not.toBeInTheDocument()
  expect(api.get).toHaveBeenCalledWith('/v1/general-exercises/catalog', expect.objectContaining({ params: {} }))
  expect(vi.mocked(api.get).mock.calls.some(([path]) => String(path).endsWith('/get/all-exercises'))).toBe(false)
})
