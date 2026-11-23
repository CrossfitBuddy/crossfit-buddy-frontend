import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { ExerciseCatalog } from './ExerciseCatalog'
import { RoundForm } from './RoundForm'
import { filterExercises, type Exercise } from './catalog'
import type { CatalogApi, CatalogFilters } from './catalogApi'
import { updateCatalogSearch } from './catalogSearch'
import { getSelection, resetSelection } from './selection'

const squat: Exercise = {
  id: '60fdbba6-0f4a-4dda-9332-f10a5e35ea55', name: 'Приседания из каталога',
  category: 'Силовые', equipment: 'Гантели', description: 'Описание из списка',
  parameters: [{ id: '919022a0-ff7c-4136-b881-fa08706df7b5', name: 'Повторения', valueType: 'INTEGER', unit: 'раз' }],
  equipmentDetails: [{ id: 'f554e542-b725-488d-8f8d-11c12ed713ed', name: 'Гантели', parameters: [
    { id: 'e87f695c-070a-4b1a-ba55-a54d2ec9f4f9', name: 'Вес', valueType: 'DECIMAL', unit: 'кг' },
  ] }],
}
const run: Exercise = {
  id: 'aaf1b268-4315-41d4-b0a8-7d6f285d5280', name: 'Бег из каталога',
  category: 'Кардио', equipment: 'Без оборудования', description: 'Описание бега',
}
const filters: CatalogFilters = {
  categories: ['Силовые', 'Кардио'].map(value => ({ value, label: value })),
  equipment: ['Гантели', 'Без оборудования'].map(value => ({ value, label: value })),
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

function createApi(): CatalogApi {
  return {
    getFilters: vi.fn(async () => filters),
    search: vi.fn(async ({ query, category, equipment }) => filterExercises([squat, run], query, category, equipment)),
    getExercise: vi.fn(async id => ({ ...[squat, run].find(item => item.id === id)!, description: 'Полное описание с сервера' })),
  }
}

function setup(api: CatalogApi) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  render(<QueryClientProvider client={client}>
    <MemoryRouter initialEntries={['/exercises']}>
      <Routes>
        <Route path="/exercises" element={<ExerciseCatalog api={api} />} />
        <Route path="/round" element={<RoundForm />} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>)
  return userEvent.setup()
}

beforeEach(() => resetSelection())

it('показывает загрузку и получает варианты фильтров от источника данных', async () => {
  const api = createApi()
  const pendingFilters = deferred<CatalogFilters>()
  const pendingList = deferred<Exercise[]>()
  vi.mocked(api.getFilters).mockReturnValue(pendingFilters.promise)
  vi.mocked(api.search).mockReturnValue(pendingList.promise)
  setup(api)
  expect(screen.getByText('Загрузка фильтров…')).toHaveAttribute('role', 'status')
  expect(screen.getByText('Загрузка упражнений…')).toHaveAttribute('role', 'status')
  expect(screen.queryByText('Ничего не найдено')).not.toBeInTheDocument()
  await act(async () => { pendingFilters.resolve(filters); pendingList.resolve([squat, run]) })
  expect(await screen.findByRole('button', { name: 'Выбрать Приседания из каталога' })).toBeInTheDocument()
  expect(within(screen.getByLabelText('Категория')).getByRole('option', { name: 'Силовые' })).toBeInTheDocument()
})

it('сохраняет выбор при ошибке поиска и позволяет повторить запрос', async () => {
  const api = createApi()
  vi.mocked(api.search).mockResolvedValueOnce([squat]).mockRejectedValueOnce(new Error('503')).mockResolvedValue([run])
  const user = setup(api)
  await user.click(await screen.findByRole('button', { name: 'Выбрать Приседания из каталога' }))
  await user.type(screen.getByLabelText('Поиск'), 'б')
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить упражнения')
  expect(screen.getByText('Выбрано: 1')).toBeInTheDocument()
  expect(screen.getByRole('list', { name: 'Выбранные упражнения' })).toHaveTextContent(squat.name)
  await user.click(screen.getByRole('button', { name: 'Повторить загрузку списка' }))
  expect(await screen.findByRole('button', { name: 'Выбрать Бег из каталога' })).toBeInTheDocument()
  expect(screen.getByRole('list', { name: 'Выбранные упражнения' })).toHaveTextContent(squat.name)
})

it('старый ответ поиска не подменяет результат нового запроса', async () => {
  const api = createApi()
  const old = deferred<Exercise[]>()
  vi.mocked(api.search).mockResolvedValueOnce([squat, run]).mockReturnValueOnce(old.promise).mockResolvedValue([run])
  setup(api)
  await screen.findByRole('button', { name: 'Выбрать Приседания из каталога' })
  fireEvent.change(screen.getByLabelText('Поиск'), { target: { value: 'п' } })
  await waitFor(() => expect(api.search).toHaveBeenCalledTimes(2))
  const signal = vi.mocked(api.search).mock.calls[1][1]
  fireEvent.change(screen.getByLabelText('Поиск'), { target: { value: 'б' } })
  await screen.findByRole('button', { name: 'Выбрать Бег из каталога' })
  await act(async () => old.resolve([squat]))
  expect(signal.aborted).toBe(true)
  expect(screen.queryByRole('button', { name: 'Выбрать Приседания из каталога' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Выбрать Бег из каталога' })).toBeInTheDocument()
})

it('повторно загружает детали после ошибки, сохраняя поиск, фильтры и выбор', async () => {
  const api = createApi()
  vi.mocked(api.getExercise).mockRejectedValueOnce(new Error('503')).mockResolvedValue({ ...squat, description: 'Полное описание с сервера' })
  const user = setup(api)
  await user.click(await screen.findByRole('button', { name: 'Выбрать Приседания из каталога' }))
  await user.type(screen.getByLabelText('Поиск'), 'прис')
  await user.selectOptions(screen.getByLabelText('Категория'), 'Силовые')
  await user.selectOptions(screen.getByLabelText('Оборудование'), 'Гантели')
  await user.click(await screen.findByRole('button', { name: 'Подробнее Приседания из каталога' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить упражнение')
  await user.click(screen.getByRole('button', { name: 'Повторить загрузку упражнения' }))
  expect(await screen.findByText('Полное описание с сервера')).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Метрики упражнения' })).toHaveTextContent('Повторения, раз')
  expect(screen.getByRole('region', { name: 'Свойства: Гантели' })).toHaveTextContent('Вес, кг')
  expect(api.getExercise).toHaveBeenLastCalledWith(squat.id, expect.any(AbortSignal))
  await user.click(screen.getByRole('button', { name: 'Закрыть' }))
  expect(screen.getByLabelText('Поиск')).toHaveValue('прис')
  expect(screen.getByLabelText('Категория')).toHaveValue('Силовые')
  expect(screen.getByLabelText('Оборудование')).toHaveValue('Гантели')
  expect(screen.getByText('Выбрано: 1')).toBeInTheDocument()
  expect(api.search).toHaveBeenLastCalledWith({ query: 'прис', category: 'Силовые', equipment: 'Гантели' }, expect.any(AbortSignal))
})

it('переносит серверные ID, порядок и повторы в раунд и сохраняет фильтры при возврате', async () => {
  const api = createApi()
  const user = setup(api)
  await user.click(await screen.findByRole('button', { name: 'Выбрать Приседания из каталога' }))
  await user.click(screen.getByRole('button', { name: 'Выбрать Бег из каталога' }))
  await user.click(screen.getByRole('button', { name: 'Выбрать Приседания из каталога' }))
  await user.click(screen.getByRole('button', { name: 'Выше 3 Приседания из каталога' }))
  await user.type(screen.getByLabelText('Поиск'), 'прис')
  await user.selectOptions(screen.getByLabelText('Категория'), 'Силовые')
  await user.selectOptions(screen.getByLabelText('Оборудование'), 'Гантели')
  await user.click(screen.getByRole('button', { name: 'Готово' }))
  const entries = getSelection().round
  expect(entries.map(item => item.exerciseId)).toEqual([squat.id, squat.id, run.id])
  expect(entries[0].exercise?.parameters).toEqual(squat.parameters)
  expect(entries[1].exercise?.equipmentDetails).toEqual(squat.equipmentDetails)
  expect(new Set(entries.map(item => item.key)).size).toBe(3)
  expect(within(screen.getByRole('list', { name: 'Упражнения раунда' })).getAllByRole('listitem').map(item => item.textContent)).toEqual([
    expect.stringContaining('1. Приседания из каталога'),
    expect.stringContaining('2. Приседания из каталога'),
    expect.stringContaining('3. Бег из каталога'),
  ])
  await user.click(screen.getByRole('button', { name: 'Удалить 1 Приседания из каталога' }))
  expect(getSelection().round.map(item => item.exerciseId)).toEqual([squat.id, run.id])
  await user.click(screen.getByRole('button', { name: 'Добавить упражнения' }))
  expect(screen.getByLabelText('Поиск')).toHaveValue('прис')
  expect(screen.getByLabelText('Категория')).toHaveValue('Силовые')
  expect(screen.getByLabelText('Оборудование')).toHaveValue('Гантели')
  await user.click(await screen.findByRole('button', { name: 'Выбрать Приседания из каталога' }))
  await user.click(screen.getByRole('button', { name: 'Готово' }))
  expect(getSelection().round.map(item => item.exerciseId)).toEqual([squat.id, run.id, squat.id])
  expect(new Set(getSelection().round.map(item => item.key)).size).toBe(3)
})

it('позволяет повторно загрузить фильтры после ошибки', async () => {
  const api = createApi()
  vi.mocked(api.getFilters).mockRejectedValueOnce(new Error('503')).mockResolvedValue(filters)
  updateCatalogSearch({ query: 'прис', category: 'Силовые', equipment: 'Гантели' })
  const user = setup(api)
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить фильтры')
  expect(screen.getByLabelText('Категория')).toHaveValue('Силовые')
  expect(screen.getByLabelText('Оборудование')).toHaveValue('Гантели')
  await user.click(screen.getByRole('button', { name: 'Повторить загрузку фильтров' }))
  expect(await screen.findByRole('option', { name: 'Гантели' })).toBeInTheDocument()
  await waitFor(() => expect(api.getFilters).toHaveBeenCalledTimes(2))
})
