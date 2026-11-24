import { useQuery } from '@tanstack/react-query'
import { downloadMedia } from './mediaApi'

export function useCatalogMedia(fileId?: string) {
  return useQuery({
    queryKey: ['media-download', fileId],
    queryFn: ({ signal }) => downloadMedia(fileId!, signal),
    enabled: Boolean(fileId),
    retry: false,
    refetchInterval: query => {
      if (!query.state.data || query.state.status === 'error') return false
      const remaining = Date.parse(query.state.data.expiresAt) - Date.now()
      return Number.isFinite(remaining) ? Math.max(1000, remaining - 5000) : false
    },
  })
}
