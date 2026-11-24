import { useState } from 'react'
import { isMediaUrl } from './catalogMedia'
import { useCatalogMedia } from './useCatalogMedia'

export function CatalogVideo({ url: legacyUrl, fileId }: { url?: string; fileId?: string }) {
  const [failedUrl, setFailedUrl] = useState<string>()
  const media = useCatalogMedia(fileId)
  const url = fileId ? media.data?.downloadUrl : legacyUrl
  if (fileId && media.isPending) return <p role="status">Загрузка видео…</p>
  if (fileId && media.isError) return <p role="alert">Не удалось загрузить видео. <button type="button" onClick={() => void media.refetch()}>Повторить загрузку видео</button></p>
  if (!url) return <p className="mt-2 text-stone-500">Видеопример не добавлен</p>
  if (!isMediaUrl(url) || failedUrl === url) return <p role="status" className="mt-2 text-stone-500">Видеопример недоступен</p>
  return <video controls preload="metadata" src={url} aria-label="Видеопример упражнения" className="mt-2 max-w-full" onError={() => setFailedUrl(url)} />
}
