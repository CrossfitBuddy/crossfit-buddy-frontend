import { api } from '../../api/http'
import type { UploadFile } from 'antd'

type UploadLink = { fileId: string; uploadUrl: string; headers: Record<string, string>; expiresAt: string }
export type DownloadLink = { downloadUrl: string; expiresAt: string }

export async function uploadMedia(file: File, signal: AbortSignal) {
  const { data } = await api.post<UploadLink>('/api/v1/admin/files/upload-url', {
    fileName: file.name, contentType: file.type, size: file.size,
  }, { signal })
  const response = await fetch(data.uploadUrl, {
    method: 'PUT', headers: data.headers, body: file, credentials: 'omit', signal,
  })
  if (!response.ok) throw new Error('Не удалось загрузить файл')
  return data.fileId
}

export async function downloadMedia(fileId: string, signal: AbortSignal) {
  const { data } = await api.get<DownloadLink>('/api/v1/files/' + encodeURIComponent(fileId) + '/download-url', { signal })
  return data
}

export function mediaId(files: UploadFile[] = []) {
  if (!files.length) return undefined
  const file = files[0]
  if (file.status !== 'done' || typeof file.response?.fileId !== 'string') throw new Error('Дождитесь успешной загрузки файла')
  return file.response.fileId as string
}

export function storedMedia(fileId?: string, name = 'Изображение'): UploadFile[] {
  return fileId ? [{ uid: fileId, name, status: 'done', response: { fileId } }] : []
}
