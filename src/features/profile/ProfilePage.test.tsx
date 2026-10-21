import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProfileScreen as ProfilePage } from './ProfileScreen'
import { createMockProfileApi, initialProfile } from './mockProfileApi'
import type { ProfileApi, ProfileResponse } from './types'

function setup(overrides: Partial<ProfileApi> = {}) {
  const api = { ...createMockProfileApi({ delay: 0 }), ...overrides }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  render(<QueryClientProvider client={client}><ProfilePage api={api} /></QueryClientProvider>)
  return { api, user: userEvent.setup() }
}

async function edit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Редактировать профиль' }))
  await screen.findByLabelText('Имя')
}

describe('Профиль', () => {
  it('показывает загрузку, затем общие данные и только блок активной роли', async () => {
    let resolve!: (profile: ProfileResponse) => void
    setup({ getProfile: () => new Promise((done) => { resolve = done }) })
    expect(screen.getByRole('status', { name: 'Загрузка профиля' })).toBeInTheDocument()
    await act(async () => { resolve(structuredClone(initialProfile)) })
    expect(await screen.findByText('Иван Петров')).toBeInTheDocument()
    expect(screen.getByText('Антропометрия и тренировки')).toBeInTheDocument()
    expect(screen.queryByText('Тренерское')).not.toBeInTheDocument()
  })

  it('повторяет загрузку после ошибки', async () => {
    const getProfile = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(initialProfile)
    const { user } = setup({ getProfile })
    await user.click(await screen.findByRole('button', { name: 'Повторить загрузку' }))
    expect(await screen.findByText('Иван Петров')).toBeInTheDocument()
    expect(getProfile).toHaveBeenCalledTimes(2)
  })

  it('отмена возвращает сохранённые данные, включая вложенные поля', async () => {
    const updateProfile = vi.fn()
    const { user } = setup({ updateProfile })
    await edit(user)
    await user.clear(screen.getByLabelText('Имя'))
    await user.type(screen.getByLabelText('Имя'), 'Другое имя')
    await user.clear(screen.getByLabelText('Рост, см'))
    await user.type(screen.getByLabelText('Рост, см'), '190')
    await user.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(screen.getByText('Иван Петров')).toBeInTheDocument()
    expect(screen.getByText('180 см')).toBeInTheDocument()
    await edit(user)
    expect(screen.getByLabelText('Имя')).toHaveValue('Иван')
    expect(screen.getByLabelText('Рост, см')).toHaveValue('180')
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('кнопка назад отменяет редактирование', async () => {
    const { user } = setup()
    await edit(user)
    await user.clear(screen.getByLabelText('Имя'))
    await user.click(screen.getByRole('button', { name: 'Назад к профилю' }))
    expect(screen.getByText('Иван Петров')).toBeInTheDocument()
    expect(screen.queryByLabelText('Имя')).not.toBeInTheDocument()
  })

  it('не сохраняет пустое имя и отрицательный рост', async () => {
    const updateProfile = vi.fn()
    const { user } = setup({ updateProfile })
    await edit(user)
    await user.clear(screen.getByLabelText('Имя'))
    await user.type(screen.getByLabelText('Имя'), '   ')
    await user.clear(screen.getByLabelText('Рост, см'))
    await user.type(screen.getByLabelText('Рост, см'), '-1')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Заполните поле')).toBeInTheDocument()
    expect(await screen.findByText('Введите число от 50 до 250')).toBeInTheDocument()
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('сохраняет изменения, обрезает пробелы и не отправляет поля другой роли', async () => {
    const mock = createMockProfileApi({ delay: 0 })
    const updateProfile = vi.fn(mock.updateProfile)
    const { user } = setup({ ...mock, updateProfile })
    await edit(user)
    await user.clear(screen.getByLabelText('Имя'))
    await user.type(screen.getByLabelText('Имя'), '  Анна  ')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Анна Петров')).toBeInTheDocument()
    expect(screen.getByText('Изменения сохранены')).toBeInTheDocument()
    expect(updateProfile).toHaveBeenCalledTimes(1)
    expect(updateProfile.mock.calls[0][0]).toMatchObject({ firstName: 'Анна', athleteProfile: { heightCm: 180 } })
    expect(updateProfile.mock.calls[0][0]).not.toHaveProperty('trainerProfile')
    expect(updateProfile.mock.calls[0][0]).not.toHaveProperty('email')
    await edit(user)
    expect(screen.queryByText('Изменения сохранены')).not.toBeInTheDocument()
  })

  it('оставляет форму после ошибки сохранения и разрешает повторную попытку', async () => {
    const updateProfile = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ ...initialProfile, firstName: 'Анна' })
    const { user } = setup({ updateProfile })
    await edit(user)
    await user.clear(screen.getByLabelText('Имя'))
    await user.type(screen.getByLabelText('Имя'), 'Анна')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Не удалось сохранить изменения')).toBeInTheDocument()
    expect(screen.getByLabelText('Имя')).toHaveValue('Анна')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Анна Петров')).toBeInTheDocument()
    expect(updateProfile).toHaveBeenCalledTimes(2)
  })

  it('блокирует поля, отмену и повторную отправку до завершения сохранения', async () => {
    let resolve!: (profile: ProfileResponse) => void
    const updateProfile = vi.fn(() => new Promise<ProfileResponse>((done) => { resolve = done }))
    const { user } = setup({ updateProfile })
    await edit(user)
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(screen.getByLabelText('Имя')).toBeDisabled())
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Назад к профилю' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Сохранение/ }))
    expect(updateProfile).toHaveBeenCalledTimes(1)
    await act(async () => { resolve(initialProfile) })
    expect(await screen.findByText('Изменения сохранены')).toBeInTheDocument()
  })

  it('переключает роль и позволяет редактировать только тренерский блок', async () => {
    const { user } = setup()
    await user.click(await screen.findByRole('combobox', { name: 'Активная роль' }))
    await user.click(await screen.findByTitle('Тренер'))
    expect(await screen.findByText('Тренерское')).toBeInTheDocument()
    expect(screen.queryByText('Антропометрия и тренировки')).not.toBeInTheDocument()
    await edit(user)
    expect(screen.getByLabelText('Стаж, лет')).toHaveValue('4')
    expect(screen.queryByLabelText('Рост, см')).not.toBeInTheDocument()
  })
  it('подсвечивает будущую дату рождения и не отправляет форму', async () => {
    const updateProfile = vi.fn()
    const { user } = setup({ updateProfile })
    await edit(user)
    fireEvent.change(screen.getByLabelText('Дата рождения'), { target: { value: '2999-01-01' } })
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Введите корректную дату не позже сегодняшней')).toBeInTheDocument()
    expect(screen.getByLabelText('Дата рождения')).toHaveAttribute('aria-invalid', 'true')
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('не превращает дробный рост с запятой в целое число', async () => {
    const updateProfile = vi.fn()
    const { user } = setup({ updateProfile })
    await edit(user)
    await user.clear(screen.getByLabelText('Рост, см'))
    await user.type(screen.getByLabelText('Рост, см'), '180,5')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(screen.getByLabelText('Рост, см')).toHaveValue('180,5')
    expect(await screen.findByText('Введите целое число')).toBeInTheDocument()
    expect(updateProfile).not.toHaveBeenCalled()
  })
  it('проверяет верхние границы роста, веса и точность веса', async () => {
    const updateProfile = vi.fn()
    const { user } = setup({ updateProfile })
    await edit(user)
    await user.clear(screen.getByLabelText('Рост, см'))
    await user.type(screen.getByLabelText('Рост, см'), '251')
    await user.clear(screen.getByLabelText('Вес, кг'))
    await user.type(screen.getByLabelText('Вес, кг'), '501')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Введите число от 50 до 250')).toBeInTheDocument()
    expect(await screen.findByText('Введите число от 20 до 500')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Вес, кг'))
    await user.type(screen.getByLabelText('Вес, кг'), '78,123')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Не более двух знаков после запятой')).toBeInTheDocument()
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it.each([
    ['-1', 'Введите число от 0 до 80'],
    ['1.5', 'Введите целое число'],
    ['1,5', 'Введите целое число'],
    ['81', 'Введите число от 0 до 80'],
  ])('не сохраняет недопустимый стаж %s', async (value, message) => {
    const updateProfile = vi.fn()
    const { user } = setup({
      getProfile: async () => ({ ...initialProfile, activeRole: 'TRAINER' }),
      updateProfile,
    })
    await edit(user)
    await user.clear(screen.getByLabelText('Стаж, лет'))
    await user.type(screen.getByLabelText('Стаж, лет'), value)
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('разрешает тренеру нулевой стаж и сохраняет его', async () => {
    const mock = createMockProfileApi({ delay: 0 })
    const updateProfile = vi.fn(mock.updateProfile)
    const { user } = setup({
      ...mock,
      getProfile: async () => { await mock.switchRole('TRAINER'); return mock.getProfile() },
      updateProfile,
    })
    await edit(user)
    await user.clear(screen.getByLabelText('Стаж, лет'))
    await user.type(screen.getByLabelText('Стаж, лет'), '0')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('0 лет')).toBeInTheDocument()
    expect(updateProfile).toHaveBeenCalledTimes(1)
    expect(updateProfile.mock.calls[0][0]).toMatchObject({ trainerProfile: { experienceYears: 0 } })
    expect(updateProfile.mock.calls[0][0]).not.toHaveProperty('athleteProfile')
    expect(updateProfile.mock.calls[0][0]).not.toHaveProperty('avatarKey')
  })
})
