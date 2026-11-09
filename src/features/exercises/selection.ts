import { useSyncExternalStore } from 'react'

export type SelectedExercise = {
  key: string
  exerciseId: string
}

export type RoundExercise = SelectedExercise & {
  parameters: Record<string, number>
}

type SelectionState = {
  pending: SelectedExercise[]
  round: RoundExercise[]
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
  const added = state.pending.map((item) => ({ ...item, parameters: {} }))
  emit({ pending: [], round: [...state.round, ...added] })
}

export const removeRoundExercise = (key: string) => {
  emit({ ...state, round: state.round.filter((item) => item.key !== key) })
}

export const updateRoundParameter = (key: string, parameterId: string, value: number | null) => {
  const round = state.round.map((item) => {
    if (item.key !== key) return item
    const parameters = { ...item.parameters }
    if (value === null) delete parameters[parameterId]
    else parameters[parameterId] = value
    return { ...item, parameters }
  })
  emit({ ...state, round })
}

export const useSelection = () => useSyncExternalStore(subscribe, getSelection, getSelection)
