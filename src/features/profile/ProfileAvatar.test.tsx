import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { ProfileAvatar } from './ProfileAvatar'
import { initialProfile } from './mockProfileApi'
import { ProfileError } from './profileApi'
import type { AvatarApi } from './avatarApi'

const file = new File(['image'], 'avatar.png', { type: 'image/png' })
beforeEach(() => {
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:avatar-test') })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
})
function setup(overrides: Partial<AvatarApi> = {}) {
  const api = { getAvatar: vi.fn().mockResolvedValue(null), replaceAvatar: vi.fn().mockResolvedValue(undefined), deleteAvatar: vi.fn().mockResolvedValue(undefined), ...overrides }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  const signOut = vi.fn()
  const view = render(<QueryClientProvider client={client}><ProfileAvatar profile={initialProfile} api={api} controls onSessionExpired={signOut} /></QueryClientProvider>)
  return { ...view, api, client, signOut, user: userEvent.setup({ applyAccept: false }) }
}
it('загружает, заменяет и удаляет аватар, освобождая URL изображений', async () => {
  const { user, api, unmount } = setup()
  const input = screen.getByLabelText('Файл аватара')
  await waitFor(() => expect(input).toBeEnabled())
  await user.upload(input, file)
  expect(await screen.findByText('Аватар сохранён')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Аватар пользователя' })).toHaveAttribute('src', 'blob:avatar-test')
  const replacement = new File(['other'], 'new.webp', { type: 'image/webp' })
  await user.upload(input, replacement)
  await waitFor(() => expect(api.replaceAvatar).toHaveBeenLastCalledWith(replacement))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Удалить аватар' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: 'Удалить аватар' }))
  expect(await screen.findByText('Аватар удалён')).toBeInTheDocument()
  expect(screen.queryByRole('img', { name: 'Аватар пользователя' })).not.toBeInTheDocument()
  expect(screen.getByText('ИП')).toBeInTheDocument()
  expect(api.deleteAvatar).toHaveBeenCalledTimes(1)
  unmount()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:avatar-test')
})
it('проверяет файл до запроса и сохраняет старый аватар при ошибке сервера', async () => {
  const replace = vi.fn().mockRejectedValueOnce(new ProfileError('Файл повреждён')).mockResolvedValue(undefined)
  const { user } = setup({ getAvatar: vi.fn().mockResolvedValue(file), replaceAvatar: replace })
  const input = screen.getByLabelText('Файл аватара')
  await waitFor(() => expect(input).toBeEnabled())
  await user.upload(input, new File(['text'], 'x.txt', { type: 'text/plain' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('JPEG')
  expect(replace).not.toHaveBeenCalled()
  await user.upload(input, file)
  expect(await screen.findByRole('alert')).toHaveTextContent('Файл повреждён')
  expect(screen.getByRole('img', { name: 'Аватар пользователя' })).toBeInTheDocument()
  await user.upload(input, file)
  expect(await screen.findByText('Аватар сохранён')).toBeInTheDocument()
})
it('блокирует повторную отправку и не восстанавливает кэш после ухода со страницы', async () => {
  let resolve!: () => void
  const replace = vi.fn(() => new Promise<void>((done) => { resolve = done }))
  const { user, unmount, client } = setup({ replaceAvatar: replace })
  const input = screen.getByLabelText('Файл аватара')
  await waitFor(() => expect(input).toBeEnabled())
  await user.upload(input, file)
  expect(input).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Загрузить аватар' })).toBeDisabled()
  await user.upload(input, file)
  expect(replace).toHaveBeenCalledTimes(1)
  unmount()
  client.clear()
  await act(async () => { resolve() })
  expect(client.getQueryData(['avatar', initialProfile.id])).toBeUndefined()
})
it('повторяет загрузку после ошибки и очищает сессию при 401', async () => {
  const get = vi.fn().mockRejectedValueOnce(new ProfileError('Нет связи')).mockRejectedValueOnce(new ProfileError('Сессия истекла', 401))
  const { user, signOut } = setup({ getAvatar: get })
  expect(await screen.findByRole('alert')).toHaveTextContent('Нет связи')
  await user.click(screen.getByRole('button', { name: 'Повторить загрузку аватара' }))
  await waitFor(() => expect(signOut).toHaveBeenCalled())
})