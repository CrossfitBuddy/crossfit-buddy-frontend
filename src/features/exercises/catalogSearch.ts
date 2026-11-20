import { useSyncExternalStore } from 'react'
import type { CatalogSearch } from './catalogApi'

const emptySearch = (): CatalogSearch => ({ query: '', category: 'all', equipment: 'all' })
let search = emptySearch()
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function updateCatalogSearch(patch: Partial<CatalogSearch>) {
  search = { ...search, ...patch }
  listeners.forEach(listener => listener())
}

export function resetCatalogSearch() {
  search = emptySearch()
  listeners.forEach(listener => listener())
}

export const useCatalogSearch = () => useSyncExternalStore(subscribe, () => search, () => search)
