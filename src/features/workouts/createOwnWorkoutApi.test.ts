import { AxiosError } from 'axios'
import { afterEach, expect, it, vi } from 'vitest'
import { api } from '../../api/http'
import { CreateWorkoutError } from './createWorkoutTypes'
import { createOwnWorkoutApi } from './createOwnWorkoutApi'
import type { OwnWorkoutRequest } from './ownWorkoutTypes'

const sampleRequest: OwnWorkoutRequest = {
  name: 'Утро',
  description: null,
  datetime: '2026-11-19T10:00:00+07:00',
  durationSeconds: 3600,
  stages: [{
    workoutStageId: 1,
    format: 'AMRAP',
    timeLimitSeconds: 720,
    rounds: [{ repeatCount: 1, exercises: [{ exerciseId: '2dd94fa9-1763-4986-82a5-6752d0a3da96' }] }],
  }],
}

afterEach(() => vi.restoreAllMocks())

it('отправляет POST на /v1/workouts и возвращает id', async () => {
  const id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { id, name: 'Утро' } })
  const { signal } = new AbortController()

  await expect(createOwnWorkoutApi.createOwnWorkout(sampleRequest, signal)).resolves.toEqual({ id })

  expect(post).toHaveBeenCalledWith('/v1/workouts', sampleRequest, { signal })
})

it('отклоняет ответ без uuid', async () => {
  vi.spyOn(api, 'post').mockResolvedValue({ data: { id: 'not-uuid' } })

  await expect(createOwnWorkoutApi.createOwnWorkout(sampleRequest)).rejects.toThrow('некорректный ответ')
})

it('пробрасывает ошибки полей с 400', async () => {
  const fieldErrors = [{
    field: 'stages[0].params.duration',
    code: 'REQUIRED_PARAMETER',
    message: 'Duration is required',
  }]
  vi.spyOn(api, 'post').mockRejectedValue(new AxiosError(
    'bad',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
  { status: 400, data: { code: 'VALIDATION_ERROR', message: 'The workout contains invalid data.', fieldErrors } } as never))

  await expect(createOwnWorkoutApi.createOwnWorkout(sampleRequest)).rejects.toSatisfy((error: unknown) => {
    expect(error).toBeInstanceOf(CreateWorkoutError)
    expect((error as CreateWorkoutError).fieldErrors).toEqual(fieldErrors)
    return true
  })
})