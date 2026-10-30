import { beforeEach, expect, it, vi } from 'vitest'
const transport = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('axios', () => ({ default: { create: () => transport, isAxiosError: (e: unknown) => !!e && typeof e === 'object' && 'isAxiosError' in e } }))
import { createAvatarApi, MAX_AVATAR_BYTES, validateAvatar } from './avatarApi'
import { ProfileError } from './profileApi'
beforeEach(() => vi.resetAllMocks())
it('принимает JPEG, PNG, WEBP и границу 5 МБ; отклоняет другие и пустые файлы', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) expect(validateAvatar(new File(['image'], 'avatar', { type }))).toBeNull()
  expect(validateAvatar(new File([new Uint8Array(MAX_AVATAR_BYTES)], 'image.png', { type: 'image/png' }))).toBeNull()
  expect(validateAvatar(new File([new Uint8Array(MAX_AVATAR_BYTES + 1)], 'image.png', { type: 'image/png' }))).toContain('5 МБ')
  expect(validateAvatar(new File(['gif'], 'image.gif', { type: 'image/gif' }))).toContain('JPEG')
  expect(validateAvatar(new File([], 'image.png', { type: 'image/png' }))).toContain('пустой')
})
it('отправляет multipart с текущим токеном, читает изображение и удаляет его', async () => {
  let token = 'first-token'
  const api = createAvatarApi(() => token)
  const file = new File(['image'], 'avatar.png', { type: 'image/png' })
  transport.put.mockResolvedValue({ status: 204 })
  await api.replaceAvatar(file)
  expect(transport.put.mock.calls[0][0]).toBe('/api/v1/users/me/avatar')
  expect(transport.put.mock.calls[0][1].get('file')).toBe(file)
  expect(transport.put.mock.calls[0][2]).toEqual({ headers: { Authorization: 'Bearer first-token' } })
  token = 'new-token'
  transport.get.mockResolvedValue({ data: file })
  const controller = new AbortController()
  expect(await api.getAvatar(controller.signal)).toBe(file)
  expect(transport.get.mock.calls[0][1]).toMatchObject({ responseType: 'blob', signal: controller.signal, headers: { Authorization: 'Bearer new-token' } })
  await api.deleteAvatar()
  expect(transport.delete.mock.calls[0]).toEqual(['/api/v1/users/me/avatar', { headers: { Authorization: 'Bearer new-token' } }])
})
it('404 означает отсутствие аватара; 401 и некорректное изображение остаются ошибками', async () => {
  const api = createAvatarApi(() => 'token')
  transport.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } })
  expect(await api.getAvatar()).toBeNull()
  transport.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } })
  await expect(api.getAvatar()).rejects.toMatchObject({ status: 401 })
  transport.get.mockResolvedValueOnce({ data: new Blob(['html'], { type: 'text/html' }) })
  await expect(api.getAvatar()).rejects.toBeInstanceOf(ProfileError)
})
it('не отправляет запрос без токена и не сохраняет секреты Axios в ошибке', async () => {
  await expect(createAvatarApi(() => null).deleteAvatar()).rejects.toMatchObject({ status: 401 })
  expect(transport.delete).not.toHaveBeenCalled()
  transport.put.mockRejectedValue({ isAxiosError: true, response: { status: 413, data: { code: 'AVATAR_TOO_LARGE' } }, config: { headers: { Authorization: 'Bearer secret' }, data: 'private-image' } })
  let error: unknown
  try { await createAvatarApi(() => 'secret').replaceAvatar(new File(['image'], 'x.png', { type: 'image/png' })) } catch (e) { error = e }
  expect(error).toMatchObject({ status: 413, message: expect.stringContaining('5 МБ') })
  expect(JSON.stringify(error)).not.toMatch(/secret|private-image/)
})