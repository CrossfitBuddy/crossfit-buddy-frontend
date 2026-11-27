import { isAxiosError } from 'axios'
import { getApiErrorStatus } from '../../api/session'
import { CreateWorkoutError, type WorkoutErrorBody } from './createWorkoutTypes'

export function getCreateWorkoutErrorMessage(error: unknown): string {
  if (error instanceof CreateWorkoutError) {
    if (error.status === 401) return 'Сессия истекла. Войдите снова.'
    if (error.status === 403) {
      return error.message || 'Создание своей тренировки доступно при активной роли атлета.'
    }
    if (error.fieldErrors.length > 0) {
      return error.message || 'Проверьте данные тренировки.'
    }
    return error.message
  }
  const status = getApiErrorStatus(error)
  if (status === 401) return 'Сессия истекла. Войдите снова.'
  if (status === 403) {
    return isAxiosError<WorkoutErrorBody>(error) && error.response?.data?.message
      ? error.response.data.message
      : 'Создание своей тренировки доступно при активной роли атлета.'
  }
  if (status === 400) {
    return isAxiosError<WorkoutErrorBody>(error) && error.response?.data?.message
      ? error.response.data.message
      : 'Проверьте данные тренировки.'
  }
  if (error instanceof Error && error.message.startsWith('Сервер вернул')) {
    return error.message
  }
  return 'Не удалось сохранить тренировку. Попробуйте ещё раз.'
}

export function getCreateWorkoutFieldErrors(error: unknown): CreateWorkoutError['fieldErrors'] {
  return error instanceof CreateWorkoutError ? error.fieldErrors : []
}