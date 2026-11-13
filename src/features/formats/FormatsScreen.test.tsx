import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormatsScreen } from './FormatsScreen'
import type { ComplexFormat, FormatType, FormatsApi } from './types'

const initial: ComplexFormat[] = [
  { type: 'EMOM', name: 'Every Minute on the Minute', description: 'Выполняй задание каждую минуту', durationRequired: true, intervalRequired: true },
  { type: 'FOR_TIME', name: 'For Time', description: 'Выполни раунды как можно быстрее', durationRequired: true, intervalRequired: false },
  { type: 'AMRAP', name: 'As Many Rounds As Possible', description: 'Максимум раундов за время', durationRequired: true, intervalRequired: false },
  { type: 'TABATA', name: 'Tabata', description: 'Работа и отдых по кругу', durationRequired: true, intervalRequired: true },
]

function createApi(overrides: Partial<FormatsApi> = {}) {
  let formats = initial
  const api = {
    getFormats: vi.fn(async () => formats),
    updateDescription: vi.fn(async (type: FormatType, description: string) => {
      const previous = formats.find((format) => format.type === type)
      if (!previous) throw new Error('Формат не найден')
      const updated = { ...previous, description }
      formats = formats.map((format) => (format.type === type ? updated : format))
      return updated
    }),
    ...overrides,
  } satisfies FormatsApi
  return api
}

function renderScreen(api: FormatsApi) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FormatsScreen api={api} />
    </QueryClientProvider>,
  )
}

describe('Экран форматов комплекса', () => {
  it('показывает четыре формата с описаниями и без создания и удаления', async () => {
    renderScreen(createApi())

    for (const format of initial) {
      expect(await screen.findByRole('heading', { name: format.name })).toBeInTheDocument()
      expect(screen.getByText(format.description)).toBeInTheDocument()
    }
    expect(screen.getAllByRole('button', { name: /Редактировать/ })).toHaveLength(4)
    expect(screen.queryByRole('button', { name: /Создать|Добавить|Удалить/ })).not.toBeInTheDocument()
  })

  it('показывает загрузку, затем ошибку с повторной попыткой', async () => {
    const getFormats = vi.fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(initial)
    const user = userEvent.setup()
    renderScreen(createApi({ getFormats }))

    expect(screen.getByRole('status')).toHaveTextContent('Загрузка форматов')
    expect(await screen.findByText('Не удалось загрузить форматы')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Повторить загрузку' }))

    expect(await screen.findByRole('heading', { name: 'As Many Rounds As Possible' })).toBeInTheDocument()
    expect(getFormats).toHaveBeenCalledTimes(2)
  })

  it('даёт менять только описание и показывает обязательность длительности и интервала', async () => {
    const user = userEvent.setup()
    renderScreen(createApi())

    await user.click(await screen.findByRole('button', { name: 'Редактировать Every Minute on the Minute' }))

    expect(screen.getByRole('textbox', { name: 'Описание' })).toBeEnabled()
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(screen.getByText('Обязательна')).toBeInTheDocument()
    expect(screen.getByText('Обязателен')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Удалить/ })).not.toBeInTheDocument()
  })

  it('показывает, что интервал необязателен для For Time', async () => {
    const user = userEvent.setup()
    renderScreen(createApi())

    await user.click(await screen.findByRole('button', { name: 'Редактировать For Time' }))

    expect(screen.getByText('Необязателен')).toBeInTheDocument()
  })

  it('сохраняет новое описание и показывает значение из ответа сервера', async () => {
    const updateDescription = vi.fn().mockResolvedValue({ ...initial[2], description: 'Сохранённое правило' })
    const api = createApi({ updateDescription })
    const user = userEvent.setup()
    renderScreen(api)

    await user.click(await screen.findByRole('button', { name: 'Редактировать As Many Rounds As Possible' }))
    const field = screen.getByRole('textbox', { name: 'Описание' })
    await user.clear(field)
    await user.type(field, '  Новое правило  ')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Описание сохранено')).toBeInTheDocument()
    expect(api.updateDescription).toHaveBeenCalledWith('AMRAP', 'Новое правило')
    const card = screen.getByRole('heading', { name: 'As Many Rounds As Possible' }).closest('li') as HTMLElement
    expect(within(card).getByText('Сохранённое правило')).toBeInTheDocument()
  })

  it('на время сохранения блокирует форму', async () => {
    let finish: (format: ComplexFormat) => void = () => {}
    const updateDescription = vi.fn(() => new Promise<ComplexFormat>((resolve) => { finish = resolve }))
    const user = userEvent.setup()
    renderScreen(createApi({ updateDescription }))

    await user.click(await screen.findByRole('button', { name: 'Редактировать Every Minute on the Minute' }))
    await user.type(screen.getByRole('textbox', { name: 'Описание' }), ' ещё')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByRole('textbox', { name: 'Описание' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled()
    expect(updateDescription).toHaveBeenCalledTimes(1)

    finish(initial[0])
    expect(await screen.findByText('Описание сохранено')).toBeInTheDocument()
  })

  it('при ошибке сохранения оставляет введённый текст и даёт повторить', async () => {
    const updateDescription = vi.fn().mockRejectedValueOnce(new Error('500')).mockResolvedValueOnce({ ...initial[0], description: 'Мой текст' })
    const user = userEvent.setup()
    renderScreen(createApi({ updateDescription }))

    await user.click(await screen.findByRole('button', { name: 'Редактировать Every Minute on the Minute' }))
    const field = screen.getByRole('textbox', { name: 'Описание' })
    await user.clear(field)
    await user.type(field, 'Мой текст')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Не удалось сохранить описание')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Описание' })).toHaveValue('Мой текст')

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Описание сохранено')).toBeInTheDocument()
    expect(updateDescription).toHaveBeenCalledTimes(2)
  })

  it('не сохраняет пустое описание', async () => {
    const api = createApi()
    const user = userEvent.setup()
    renderScreen(api)

    await user.click(await screen.findByRole('button', { name: 'Редактировать Tabata' }))
    await user.clear(screen.getByRole('textbox', { name: 'Описание' }))
    await user.type(screen.getByRole('textbox', { name: 'Описание' }), '   ')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Поле "Описание" обязательно для заполнения')).toBeInTheDocument()
    expect(api.updateDescription).not.toHaveBeenCalled()
  })

  it('отмена возвращает к списку без запроса', async () => {
    const api = createApi()
    const user = userEvent.setup()
    renderScreen(api)

    await user.click(await screen.findByRole('button', { name: 'Редактировать Every Minute on the Minute' }))
    await user.type(screen.getByRole('textbox', { name: 'Описание' }), ' лишнее')
    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(await screen.findByRole('heading', { name: 'Форматы комплекса' })).toBeInTheDocument()
    expect(screen.getByText('Выполняй задание каждую минуту')).toBeInTheDocument()
    expect(api.updateDescription).not.toHaveBeenCalled()
  })
})
