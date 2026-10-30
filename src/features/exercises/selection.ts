import { useSyncExternalStore } from 'react'

export type SelectedExercise = {
  key: string
  exerciseId: string
}

type SelectionState = {
  pending: SelectedExercise[]
  round: SelectedExercise[]
}

let nextKey = 1
let state: SelectionState = { pending: [], round: [] }
const listeners = new Set<() => void>()

const emit = (next: SelectionState) => {
  state = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getSelection = () => state

export const resetSelection = () => {
  nextKey = 1
  emit({ pending: [], round: [] })
}

export const addExercise = (exerciseId: string) => {
  const item = { key: String(nextKey++), exerciseId }
  emit({ ...state, pending: [...state.pending, item] })
}

export const removePendingAt = (index: number) => {
  emit({ ...state, pending: state.pending.filter((_, itemIndex) => itemIndex !== index) })
}

export const removeLastPending = (exerciseId: string) => {
  let index = -1
  state.pending.forEach((item, itemIndex) => {
    if (item.exerciseId === exerciseId) index = itemIndex
  })
  if (index >= 0) removePendingAt(index)
}

export const movePending = (index: number, direction: -1 | 1) => {
  const target = index + direction
  if (target < 0 || target >= state.pending.length) return
  const pending = state.pending.slice()
  const [item] = pending.splice(index, 1)
  pending.splice(target, 0, item)
  emit({ ...state, pending })
}

export const confirmSelection = () => {
  emit({ pending: [], round: [...state.round, ...state.pending] })
}

export const useSelection = () => useSyncExternalStore(subscribe, getSelection, getSelection)
