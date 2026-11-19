import { AxiosError } from 'axios'
import { expect, it } from 'vitest'
import { CreateWorkoutError } from './createWorkoutTypes'
import { getCreateWorkoutErrorMessage, getCreateWorkoutFieldErrors } from './createOwnWorkoutErrors'

const httpError = (status: number, message?: string) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: message ? { message } : {},
  } as never)

it('подставляет сообщения по статусам', () => {
  expect(getCreateWorkoutErrorMessage(httpError(401))).toBe('Сессия истекла. Войдите снова.')
  expect(getCreateWorkoutErrorMessage(new CreateWorkoutError(403, ''))).toContain('атлета')
  expect(getCreateWorkoutErrorMessage(httpError(400, 'WOD обязателен'))).toBe('WOD обязателен')
})

it('возвращает fieldErrors из CreateWorkoutError', () => {
  const errors = [{ field: 'name', code: 'X', message: 'Too long' }]
  const error = new CreateWorkoutError(400, 'Invalid', 'VALIDATION_ERROR', errors)
  expect(getCreateWorkoutFieldErrors(error)).toEqual(errors)
  expect(getCreateWorkoutErrorMessage(error)).toBe('Invalid')
})