import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ExerciseEditor } from './ExerciseEditor'
import { createMockExerciseApi, demoExercise, demoExerciseId } from './mockExerciseApi'

function setup(id?: string) {
  const api = createMockExerciseApi(0)
  const saveExercise = vi.spyOn(api, 'saveExercise')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const start = id ? `/exercises/${id}/edit` : '/exercises/new'
  const view = render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={[start]}>
          <Routes>
            <Route path="/exercises" element={<p>Список упражнений</p>} />
            <Route path={start} element={<ExerciseEditor id={id} api={api} />} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
  return { api, saveExercise, container: view.container, user: userEvent.setup() }
}

const saveButton = () => screen.getByRole('button', { name: 'Сохранить' })

async function fillMain(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Название'), '  Бёрпи  ')
  await user.type(screen.getByLabelText('Описание'), 'Упор лёжа, отжимание и прыжок вверх')
}

describe('Форма упражнения', () => {
  it('сохраняет новое упражнение и возвращает к списку', async () => {
    const { saveExercise, user } = setup()
    expect(await screen.findByRole('button', { name: 'Сохранить' })).toBeDisabled()
    await fillMain(user)
    await waitFor(() => expect(saveButton()).toBeEnabled())
    await user.click(saveButton())

    expect(await screen.findByText('Список упражнений')).toBeInTheDocument()
    expect(saveExercise).toHaveBeenCalledWith({
      name: 'Бёрпи',
      description: 'Упор лёжа, отжимание и прыжок вверх',
      media: [],
      metrics: [],
      equipment: [],
    }, undefined)
  })

  it('показывает ошибки обязательных полей и длины описания', async () => {
    const { user } = setup()
    const name = await screen.findByLabelText('Название')
    await user.type(name, 'а')
    await user.clear(name)
    expect(await screen.findByText('Поле "Название" обязательно для заполнения')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Описание'), '  Коротко  ')
    expect(await screen.findByText('Не менее 10 символов')).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
  })

  it('не допускает метрики с одинаковыми названиями', async () => {
    const { user } = setup()
    await fillMain(user)
    await user.click(screen.getByRole('button', { name: 'Добавить метрику' }))
    await user.click(screen.getByRole('button', { name: 'Добавить метрику' }))
    const names = screen.getAllByLabelText('Название метрики')
    await user.type(names[0], 'Время')
    await user.type(names[1], ' время ')

    expect(await screen.findAllByText('Метрики с одинаковыми названиями не допускаются')).not.toHaveLength(0)
    expect(saveButton()).toBeDisabled()

    await user.click(screen.getAllByRole('button', { name: 'Удалить метрику' })[1])
    await waitFor(() => expect(screen.queryByText('Метрики с одинаковыми названиями не допускаются')).not.toBeInTheDocument())
  })

  it('не допускает одинаковые свойства у оборудования и проверяет единицы измерения', async () => {
    const { user } = setup()
    await fillMain(user)
    await user.click(screen.getByRole('button', { name: 'Добавить оборудование' }))
    await user.type(screen.getByLabelText('Название оборудования'), 'Гиря')
    await user.click(screen.getByRole('button', { name: 'Добавить свойство' }))
    await user.click(screen.getByRole('button', { name: 'Добавить свойство' }))
    const names = screen.getAllByLabelText('Название свойства')
    await user.type(names[0], 'Вес')
    await user.type(names[1], 'вес')
    await user.type(screen.getAllByLabelText('Единица измерения')[0], 'кг1')

    expect(await screen.findAllByText('Свойства оборудования с одинаковыми названиями не допускаются')).not.toHaveLength(0)
    expect(await screen.findByText('Только буквы')).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
  })

  it('подставляет тип и единицу при выборе существующей метрики', async () => {
    const { user } = setup()
    await screen.findByLabelText('Название')
    await user.click(screen.getByRole('button', { name: 'Добавить метрику' }))
    await user.type(screen.getByLabelText('Название метрики'), 'Дист')
    await user.click(await screen.findByTitle('Дистанция'))

    expect(screen.getByLabelText('Единица измерения')).toHaveValue('м')
    expect(screen.getByText('Вещественное число')).toBeInTheDocument()
  })

  it('принимает только изображения JPG и PNG', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    const { container } = setup()
    await screen.findByLabelText('Название')
    const input = () => container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input(), { target: { files: [new File(['%PDF'], 'plan.pdf', { type: 'application/pdf' })] } })
    expect(await screen.findByText('Можно загрузить только JPG или PNG')).toBeInTheDocument()
    expect(container.querySelectorAll('.ant-upload-list-item')).toHaveLength(0)

    fireEvent.change(input(), { target: { files: [new File(['png'], 'burpee.png', { type: 'image/png' })] } })
    await waitFor(() => expect(container.querySelectorAll('.ant-upload-list-item')).toHaveLength(1))
  })

  it('при редактировании предзаполняет форму и сохраняет изменения', async () => {
    const { saveExercise, user } = setup(demoExerciseId)
    const name = await screen.findByLabelText('Название')
    expect(name).toHaveValue(demoExercise.name)
    expect(screen.getByLabelText('Название метрики')).toHaveValue('Количество повторений')
    expect(screen.getByLabelText('Название оборудования')).toHaveValue('Гиря')
    const equipment = screen.getByLabelText('Название оборудования').closest('.rounded-2xl') as HTMLElement
    expect(within(equipment).getByLabelText('Название свойства')).toHaveValue('Вес')
    await waitFor(() => expect(saveButton()).toBeEnabled())

    await user.clear(name)
    await user.type(name, 'Свинг гири двумя руками')
    await waitFor(() => expect(saveButton()).toBeEnabled())
    await user.click(saveButton())

    await screen.findByText('Список упражнений')
    expect(saveExercise).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Свинг гири двумя руками', metrics: demoExercise.metrics }),
      demoExerciseId,
    )
  })

  it('отмена возвращает к списку без сохранения', async () => {
    const { saveExercise, user } = setup()
    await fillMain(user)
    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(await screen.findByText('Список упражнений')).toBeInTheDocument()
    expect(saveExercise).not.toHaveBeenCalled()
  })

  it('сообщает, если упражнение не найдено', async () => {
    setup('missing')
    expect(await screen.findByText('Не удалось открыть упражнение')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Сохранить' })).not.toBeInTheDocument()
  })
})
