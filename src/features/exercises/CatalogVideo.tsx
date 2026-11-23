import { useState } from 'react'
import { isMediaUrl } from './catalogMedia'

export function CatalogVideo({ url }: { url?: string }) {
  const [failedUrl, setFailedUrl] = useState<string>()
  if (!url) return <p className="mt-2 text-stone-500">Видеопример не добавлен</p>
  if (!isMediaUrl(url) || failedUrl === url) return <p role="status" className="mt-2 text-stone-500">Видеопример недоступен</p>
  return <video controls preload="metadata" src={url} aria-label="Видеопример упражнения" className="mt-2 max-w-full" onError={() => setFailedUrl(url)} />
}
