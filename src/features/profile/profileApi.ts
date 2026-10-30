import axios from 'axios'
import { z } from 'zod'
import { isValidBirthDate } from './profileValues'
import type { ProfileApi, ProfileResponse, UpdateProfileRequest } from './types'

const role = z.enum(['ATHLETE', 'TRAINER', 'ADMIN'])
const text = z.string().nullable().default(null)
const profileSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  roles: z.array(role).min(1),
  displayName: z.string(),
  initials: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: text.refine((value) => value === null || isValidBirthDate(value)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().default(null),
  city: text,
  about: text,
  avatarUrl: text,
  athlete: z.object({
    heightCm: z.number().finite().nullable().default(null),
    weightKg: z.number().finite().nullable().default(null),
    fitnessLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).nullable().default(null),
    rxPreference: z.enum(['RX', 'SCALED']).nullable().default(null),
  }).nullable().default(null),
  trainer: z.object({
    specializations: text,
    experienceYears: z.number().finite().nullable().default(null),
    methodology: text,
  }).nullable().default(null),
})

export const profileFields = [
  'firstName', 'lastName', 'birthDate', 'gender', 'city', 'about',
  'athleteProfile.heightCm', 'athleteProfile.weightKg', 'athleteProfile.fitnessLevel', 'athleteProfile.rxPreference',
  'trainerProfile.specializations', 'trainerProfile.experienceYears', 'trainerProfile.methodology',
] as const

export type ProfileFieldError = { field: typeof profileFields[number]; message: string }

export class ProfileError extends Error {
  readonly status: number
  readonly fields: ProfileFieldError[]
  constructor(message: string, status = 0, fields: ProfileFieldError[] = []) {
    super(message)
    this.name = 'ProfileError'
    this.status = status
    this.fields = fields
  }
}

function fieldError(field: unknown, message: unknown): ProfileFieldError | null {
  if (typeof field === 'string') field = field.replace(/^athlete\./, 'athleteProfile.').replace(/^trainer\./, 'trainerProfile.')
  if (typeof field !== 'string' || !profileFields.includes(field as typeof profileFields[number])) return null
  const required = typeof message === 'string' && /required|not.?blank|not.?null|обязател|заполн/i.test(message)
  return { field: field as typeof profileFields[number], message: required ? 'Заполните поле' : 'Проверьте значение поля' }
}

export function profileRequestError(error: unknown): ProfileError {
  if (error instanceof ProfileError) return error
  if (!axios.isAxiosError(error)) return new ProfileError('Не удалось выполнить запрос. Попробуйте ещё раз.')
  if (!error.response) return new ProfileError('Не удалось связаться с сервером. Проверьте подключение и повторите попытку.')
  const status = error.response.status
  const data: unknown = error.response.data
  const fields: ProfileFieldError[] = []
  if (data && typeof data === 'object' && (status === 400 || status === 422)) {
    const body = data as { fieldErrors?: unknown; message?: unknown }
    if (Array.isArray(body.fieldErrors)) {
      for (const value of body.fieldErrors) {
        if (value && typeof value === 'object') {
          const parsed = fieldError(value.field, value.message)
          if (parsed) fields.push(parsed)
        }
      }
    }
    if (!fields.length && typeof body.message === 'string') {
      const separator = body.message.indexOf(':')
      const parsed = fieldError(body.message.slice(0, separator), body.message.slice(separator + 1))
      if (separator > 0 && parsed) fields.push(parsed)
    }
  }
  const messages: Record<number, string> = {
    400: 'Сервер отклонил данные. Проверьте заполненные поля.',
    401: 'Сессия истекла. Войдите снова.',
    403: 'Нет доступа к профилю.',
    404: 'Профиль недоступен на сервере. Попробуйте позже.',
    409: 'Профиль изменился на сервере. Загрузите свежие данные перед повторным сохранением.',
    422: 'Сервер отклонил данные. Проверьте заполненные поля.',
    429: 'Слишком много запросов. Попробуйте позже.',
  }
  return new ProfileError(messages[status] ?? 'Не удалось выполнить запрос. Попробуйте ещё раз.', status, fields)
}

export function createProfileApi(getToken: () => string | null, accountId?: string): Pick<ProfileApi, 'getProfile' | 'updateProfile'> {
  const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '', timeout: 15000 })
  const config = () => {
    const token = getToken()
    if (!token) throw new ProfileError('Сессия истекла. Войдите снова.', 401)
    return { headers: { Authorization: 'Bearer ' + token } }
  }
  const parse = (value: unknown): ProfileResponse => {
    const result = profileSchema.safeParse(value)
    if (!result.success || (accountId && result.data.id !== accountId)) throw new ProfileError('Сервер вернул некорректный профиль. Попробуйте позже.')
    const { athlete, trainer, ...common } = result.data
    return { ...common, avatarKey: null, activeRole: common.roles[0], athleteProfile: athlete, trainerProfile: trainer }
  }
  return {
    async getProfile(signal?: AbortSignal) {
      try { return parse((await http.get('/api/v1/users/me', { ...config(), signal })).data) }
      catch (error) { throw profileRequestError(error) }
    },
    async updateProfile(request: UpdateProfileRequest) {
      const { athleteProfile, trainerProfile, ...common } = request
      const body = { ...common,
        ...(athleteProfile ? { athlete: athleteProfile } : {}),
        ...(trainerProfile ? { trainer: trainerProfile } : {}),
      }
      try { return parse((await http.put('/api/v1/users/me', body, config())).data) }
      catch (error) { throw profileRequestError(error) }
    },
  }
}
