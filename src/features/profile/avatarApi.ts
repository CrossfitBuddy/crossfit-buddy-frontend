import axios from 'axios'
import { ProfileError, profileRequestError } from './profileApi'

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024
export function validateAvatar(file: File): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Выберите изображение JPEG, PNG или WEBP'
  if (!file.size) return 'Файл пустой. Выберите другое изображение'
  if (file.size > MAX_AVATAR_BYTES) return 'Размер файла не должен превышать 5 МБ'
  return null
}

function avatarError(error: unknown): ProfileError {
  if (axios.isAxiosError(error)) {
    const code: unknown = error.response?.data?.code
    const messages: Record<string, string> = {
      INVALID_AVATAR: 'Файл не удалось прочитать. Выберите изображение JPEG, PNG или WEBP',
      AVATAR_TOO_LARGE: 'Размер файла не должен превышать 5 МБ',
      AVATAR_DIMENSIONS: 'Размер изображения не должен превышать 16 миллионов пикселей',
    }
    if (typeof code === 'string' && messages[code]) return new ProfileError(messages[code], error.response?.status)
    if (error.response?.status === 413) return new ProfileError(messages.AVATAR_TOO_LARGE, 413)
  }
  return profileRequestError(error)
}

export function createAvatarApi(getToken: () => string | null) {
  const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '', timeout: 30000 })
  const config = () => {
    const token = getToken()
    if (!token) throw new ProfileError('Сессия истекла. Войдите снова.', 401)
    return { headers: { Authorization: 'Bearer ' + token } }
  }
  const path = '/api/v1/users/me/avatar'
  return {
    async getAvatar(signal?: AbortSignal): Promise<Blob | null> {
      try {
        const response = await http.get<Blob>(path, { ...config(), signal, responseType: 'blob' })
        if (!response.data.size || !['image/jpeg', 'image/png', 'image/webp'].includes(response.data.type)) {
          throw new ProfileError('Не удалось загрузить изображение. Попробуйте ещё раз.')
        }
        return response.data
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) return null
        throw avatarError(error)
      }
    },
    async replaceAvatar(file: File): Promise<void> {
      const error = validateAvatar(file)
      if (error) throw new ProfileError(error)
      const body = new FormData()
      body.append('file', file)
      try { await http.put(path, body, config()) }
      catch (error) { throw avatarError(error) }
    },
    async deleteAvatar(): Promise<void> {
      try { await http.delete(path, config()) }
      catch (error) { throw avatarError(error) }
    },
  }
}
export type AvatarApi = ReturnType<typeof createAvatarApi>