import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormatsScreen } from './FormatsScreen'
import type { ComplexFormat, FormatsApi } from './types'

const initial: ComplexFormat[] = [
  { code: 'EMOM', name: 'EMOM', description: 'Выполняй задание каждую минуту', duration: 600, interval: 60 },
  { code: 'FOR_TIME', name: 'For Time', description: 'Выполни раунды как можно быстрее', duration: 900, interval: null },
  { code: 'AMRAP', name: 'AMRAP', description: 'Максимум раундов за время', duration: 1200, interval: null },
  { code: 'TABATA', name: 'Tabata', description: 'Работа и отдых по кругу', duration: 20, interval: 10 },
]

function createApi(overrides: Partial<FormatsApi> = {}) {
  let formats = initial
  const api = {
    getFormats: vi.fn(async () => formats),
    updateDescription: vi.fn(async (code: string, description: string) => {
      formats = formats.map((format) => (format.code === code ? { ...format, description } : format))
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

    expect(await screen.findByRole('heading', { name: 'AMRAP' })).toBeInTheDocument()
    expect(getFormats).toHaveBeenCalledTimes(2)
  })

  it('открывает форму: описание редактируется, длительность и интервал заблокированы', async () => {
    const user = userEvent.setup()
    renderScreen(createApi())

    await user.click(await screen.findByRole('button', { name: 'Редактировать EMOM' }))

    expect(screen.getByRole('textbox', { name: 'Описание' })).toBeEnabled()
    const [duration, interval] = screen.getAllByRole('spinbutton')
    expect(duration).toBeDisabled()
    expect(interval).toBeDisabled()
    expect(screen.queryByRole('button', { name: /Удалить/ })).not.toBeInTheDocument()
  })

  it('не показывает интервал у формата, где его нет', async () => {
    const user = userEvent.setup()
    renderScreen(createApi())

    await user.click(await screen.findByRole('button', { name: 'Редактировать For Time' }))

    expect(screen.getAllByRole('spinbutton')).toHaveLength(1)
  })

  it('сохраняет новое описание и показывает его в списке', async () => {
    const api = createApi()
    const user = userEvent.setup()
    renderScreen(api)

    await user.click(await screen.findByRole('button', { name: 'Редактировать AMRAP' }))
    const field = screen.getByRole('textbox', { name: 'Описание' })
    await user.clear(field)
    await user.type(field, '  Новое правило  ')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Описание сохранено')).toBeInTheDocument()
    expect(api.updateDescription).toHaveBeenCalledWith('AMRAP', 'Новое правило')
    const card = screen.getByRole('heading', { name: 'AMRAP' }).closest('li') as HTMLElement
    expect(within(card).getByText('Новое правило')).toBeInTheDocument()
  })

  it('на время сохранения блокирует форму', async () => {
    let finish: () => void = () => {}
    const updateDescription = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    const user = userEvent.setup()
    renderScreen(createApi({ updateDescription }))

    await user.click(await screen.findByRole('button', { name: 'Редактировать EMOM' }))
    await user.type(screen.getByRole('textbox', { name: 'Описание' }), ' ещё')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByRole('textbox', { name: 'Описание' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled()
    expect(updateDescription).toHaveBeenCalledTimes(1)

    finish()
    expect(await screen.findByText('Описание сохранено')).toBeInTheDocument()
  })

  it('при ошибке сохранения оставляет введённый текст и даёт повторить', async () => {
    const updateDescription = vi.fn().mockRejectedValueOnce(new Error('500')).mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    renderScreen(createApi({ updateDescription }))

    await user.click(await screen.findByRole('button', { name: 'Редактировать EMOM' }))
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

    await user.click(await screen.findByRole('button', { name: 'Редактировать EMOM' }))
    await user.type(screen.getByRole('textbox', { name: 'Описание' }), ' лишнее')
    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(await screen.findByRole('heading', { name: 'Форматы комплекса' })).toBeInTheDocument()
    expect(screen.getByText('Выполняй задание каждую минуту')).toBeInTheDocument()
    expect(api.updateDescription).not.toHaveBeenCalled()
  })
})
