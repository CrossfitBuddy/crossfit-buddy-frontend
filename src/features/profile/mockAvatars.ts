const avatars = new Map<string, string>()

export function createMockAvatar(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Выберите изображение JPG, PNG или WebP')
  if (file.size > 5 * 1024 * 1024) throw new Error('Размер изображения должен быть не больше 5 МБ')
  const key = `mock-avatar/${crypto.randomUUID()}`
  avatars.set(key, URL.createObjectURL(file))
  return key
}

export const getAvatarUrl = (key: string | null) => key ? avatars.get(key) : undefined

export function releaseMockAvatar(key: string | null) {
  if (!key) return
  const url = avatars.get(key)
  if (url) URL.revokeObjectURL(url)
  avatars.delete(key)
}
