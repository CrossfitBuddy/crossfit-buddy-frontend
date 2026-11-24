import { useState } from 'react'
import type { Exercise } from './catalog'
import { isMediaUrl } from './catalogMedia'
import { useCatalogMedia } from './useCatalogMedia'

const tones: Record<string, string> = {
  Грудь: '#65a30d',
  Икры: '#4d7c0f',
  Кардио: '#84cc16',
  Ноги: '#3f6212',
  Плечи: '#a3e635',
  Пресс: '#166534',
  Руки: '#14532d',
  Спина: '#365314',
}

export function Illustration({ exercise, large = false }: { exercise: Exercise; large?: boolean }) {
  const size = large ? 160 : 56
  const [failedUrl, setFailedUrl] = useState<string>()
  const media = useCatalogMedia(exercise.imageFileId)
  const url = exercise.imageFileId ? media.data?.downloadUrl : exercise.imageUrl
  if (url && isMediaUrl(url) && failedUrl !== url) {
    return <img src={url} alt={`Иллюстрация: ${exercise.name}`} width={size} height={size}
      className="shrink-0 rounded-2xl object-contain" style={{ width: size, height: size }} onError={() => setFailedUrl(url)} />
  }
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={`Иллюстрация: ${exercise.name}`} className="shrink-0 rounded-2xl">
      <rect width="80" height="80" rx="16" fill={tones[exercise.category] ?? '#65a30d'} />
      <rect x="18" y="34" width="44" height="12" rx="4" fill="#17200f" />
      <rect x="12" y="28" width="8" height="24" rx="3" fill="#f7f7f5" />
      <rect x="60" y="28" width="8" height="24" rx="3" fill="#f7f7f5" />
    </svg>
  )
}
