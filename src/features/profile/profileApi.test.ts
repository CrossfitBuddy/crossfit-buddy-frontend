import { beforeEach, describe, expect, it, vi } from 'vitest'
const transport = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }))
vi.mock('axios', () => ({
  default: { create: () => transport, isAxiosError: (error: unknown) => !!error && typeof error === 'object' && 'isAxiosError' in error },
}))
import { createProfileApi, ProfileError, profileRequestError } from './profileApi'
import { initialProfile } from './mockProfileApi'

beforeEach(() => vi.resetAllMocks())
describe('Запросы профиля', () => {
  it('загружает профиль с токеном и сигналом отмены', async () => {
    transport.get.mockResolvedValue({ data: initialProfile })
    const controller = new AbortController()
    const api = createProfileApi(() => 'test-token', initialProfile.id)
    await expect(api.getProfile(controller.signal)).resolves.toEqual(initialProfile)
    expect(transport.get).toHaveBeenCalledWith('/api/users/me', { headers: { Authorization: 'Bearer test-token' }, signal: controller.signal })
  })
  it('отправляет PATCH и использует текущий токен после смены роли', async () => {
    let token = 'first-token'
    const api = createProfileApi(() => token)
    transport.get.mockResolvedValue({ data: initialProfile })
    transport.patch.mockResolvedValue({ data: { ...initialProfile, firstName: 'Анна' } })
    await api.getProfile()
    token = 'new-token'
    const saved = await api.updateProfile({ firstName: 'Анна', lastName: 'Петров', birthDate: null, gender: null, city: null, about: null })
    expect(saved.firstName).toBe('Анна')
    expect(transport.patch.mock.calls[0][0]).toBe('/api/users/me')
    expect(transport.patch.mock.calls[0][2]).toEqual({ headers: { Authorization: 'Bearer new-token' } })
  })
  it('не делает запрос без сессии и не возвращает чужой профиль', async () => {
    await expect(createProfileApi(() => null).getProfile()).rejects.toMatchObject({ status: 401 })
    expect(transport.get).not.toHaveBeenCalled()
    transport.get.mockResolvedValue({ data: { ...initialProfile, id: 'another-user' } })
    await expect(createProfileApi(() => 'token', initialProfile.id).getProfile()).rejects.toThrow('Сервер вернул некорректный профиль')
  })
  it('не принимает старый неполный DTO как готовый профиль', async () => {
    transport.get.mockResolvedValue({ data: { id: initialProfile.id, email: initialProfile.email, displayName: 'Иван' } })
    await expect(createProfileApi(() => 'token').getProfile()).rejects.toBeInstanceOf(ProfileError)
  })
  it('обрабатывает поля, пропущенные из-за null в JSON', async () => {
    transport.get.mockResolvedValue({ data: { id: initialProfile.id, email: initialProfile.email, roles: ['ATHLETE'], activeRole: 'ATHLETE' } })
    expect(await createProfileApi(() => 'token').getProfile()).toMatchObject({ firstName: null, city: null, athleteProfile: null, trainerProfile: null })
  })
  it('привязывает текущую backend-ошибку валидации к полю', () => {
    const error = profileRequestError({ isAxiosError: true, response: { status: 400, data: { code: 'VALIDATION_ERROR', message: 'firstName: First name is required.' } } })
    expect(error.fields).toEqual([{ field: 'firstName', message: 'Заполните поле' }])
  })
  it('распознаёт вложенные ошибки и игнорирует неизвестные поля', () => {
    const error = profileRequestError({ isAxiosError: true, response: { status: 422, data: { fieldErrors: [{ field: 'athleteProfile.heightCm', message: 'out of range' }, { field: 'roles', message: 'forbidden' }] } } })
    expect(error.fields).toEqual([{ field: 'athleteProfile.heightCm', message: 'Проверьте значение поля' }])
  })
  it('не возвращает Axios config с токеном и данными запроса', async () => {
    transport.patch.mockRejectedValue({ isAxiosError: true, response: { status: 500 }, config: { headers: { Authorization: 'Bearer secret-token' }, data: 'private-profile' } })
    let caught: unknown
    try { await createProfileApi(() => 'secret-token').updateProfile({ firstName: null, lastName: null, birthDate: null, gender: null, city: null, about: null }) } catch (error) { caught = error }
    expect(caught).toBeInstanceOf(ProfileError)
    expect(JSON.stringify(caught)).not.toMatch(/secret-token|private-profile/)
  })
})
