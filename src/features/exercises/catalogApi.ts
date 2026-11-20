import type { Exercise } from './catalog'

// Интерфейс экрана. HTTP-адаптер будет подключён по контракту CB-18704.
export type CatalogSearch = { query: string; category: string; equipment: string }
export type CatalogFilters = { categories: string[]; equipment: string[] }

export type CatalogApi = {
  getFilters: (signal: AbortSignal) => Promise<CatalogFilters>
  search: (search: CatalogSearch, signal: AbortSignal) => Promise<Exercise[]>
  getExercise: (id: string, signal: AbortSignal) => Promise<Exercise>
}
