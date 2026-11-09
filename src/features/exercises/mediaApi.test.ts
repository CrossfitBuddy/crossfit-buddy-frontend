import { afterEach, expect, it, vi } from 'vitest'
import { api } from '../../api/http'
import { uploadMedia } from './mediaApi'
import { exerciseApi } from './exerciseApi'
import { demoExercise } from './mockExerciseApi'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('запрашивает ссылку с метаданными и загружает файл отдельным PUT', async () => {
  const file = new File(['image'], 'photo.png', { type: 'image/png' })
  const signal = new AbortController().signal
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {
    fileId: 'image-id', uploadUrl: 'https://storage.test/signed', headers: { 'Content-Type': 'image/png' },
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  } })
  const put = vi.fn().mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', put)
  await expect(uploadMedia(file, signal)).resolves.toBe('image-id')
  expect(post).toHaveBeenCalledWith('/api/v1/admin/files/upload-url', {
    fileName: 'photo.png', contentType: 'image/png', size: file.size,
  }, { signal })
  expect(put).toHaveBeenCalledWith('https://storage.test/signed', {
    method: 'PUT', headers: { 'Content-Type': 'image/png' }, credentials: 'omit', body: file, signal,
  })
  put.mockResolvedValue({ ok: false })
  await expect(uploadMedia(file, signal)).rejects.toThrow()
})

it('повторное сохранение передаёт прежние идентификаторы изображения, видео и оборудования', async () => {
  const post = vi.spyOn(api, 'post').mockRejectedValueOnce(new Error('Ошибка сервера')).mockResolvedValue({})
  const saved = (id: string) => [{ uid: id, name: id, status: 'done' as const, response: { fileId: id } }]
  const value = { ...demoExercise, media: saved('picture'), video: saved('video'),
    equipment: [{ ...demoExercise.equipment[0], image: saved('equipment') }] }
  await expect(exerciseApi.saveExercise(value)).rejects.toThrow()
  await exerciseApi.saveExercise(value)
  for (const [path, data] of post.mock.calls) {
    expect(path).toBe('/v1/general-exercises/set')
    const fields = Object.fromEntries((data as FormData).entries())
    expect(fields).toMatchObject({ imageFileId: 'picture', fileId: 'video', 'exercisesEquipments[0].imageFileId': 'equipment' })
    expect(Object.values(fields).every(field => typeof field === 'string')).toBe(true)
  }
})
