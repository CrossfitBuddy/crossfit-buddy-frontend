import type { AthleteProfile, Gender, ProfileResponse, ProfileRole, TrainerProfile, UpdateProfileRequest } from './types'

export const genderOptions = [
  { value: 'MALE', label: 'Мужской' },
  { value: 'FEMALE', label: 'Женский' },
  { value: 'OTHER', label: 'Другой' },
]
export const fitnessOptions = [
  { value: 'BEGINNER', label: 'Начальный' },
  { value: 'INTERMEDIATE', label: 'Средний' },
  { value: 'ADVANCED', label: 'Продвинутый' },
]
export const rxOptions = [
  { value: 'RX', label: 'RX — стандартная нагрузка' },
  { value: 'SCALED', label: 'Scaled — адаптированная нагрузка' },
]
export const roleLabels: Record<ProfileRole, string> = { ATHLETE: 'Атлет', TRAINER: 'Тренер', ADMIN: 'Администратор' }

export type ProfileFormValues = {
  firstName: string
  lastName: string
  birthDate: string
  gender: Gender | null
  city: string
  about: string
  athleteProfile: AthleteProfile
  trainerProfile: TrainerProfile
}

export const today = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === value && value <= today()
}

export const toFormValues = (profile: ProfileResponse): ProfileFormValues => ({
  firstName: profile.firstName ?? '',
  lastName: profile.lastName ?? '',
  birthDate: profile.birthDate ?? '',
  gender: profile.gender,
  city: profile.city ?? '',
  about: profile.about ?? '',
  athleteProfile: profile.athleteProfile ? { ...profile.athleteProfile } : { heightCm: null, weightKg: null, fitnessLevel: null, rxPreference: null },
  trainerProfile: profile.trainerProfile ? { ...profile.trainerProfile } : { specializations: null, experienceYears: null, methodology: null },
})

const nullableText = (value: string | null | undefined) => value?.trim() || null

export function toUpdateRequest(values: ProfileFormValues, role: ProfileRole): UpdateProfileRequest {
  return {
    firstName: nullableText(values.firstName),
    lastName: nullableText(values.lastName),
    birthDate: values.birthDate || null,
    gender: values.gender ?? null,
    city: nullableText(values.city),
    about: nullableText(values.about),
    ...(role === 'ATHLETE' ? { athleteProfile: {
      heightCm: values.athleteProfile.heightCm ?? null,
      weightKg: values.athleteProfile.weightKg ?? null,
      fitnessLevel: values.athleteProfile.fitnessLevel ?? null,
      rxPreference: values.athleteProfile.rxPreference ?? null,
    } } : {}),
    ...(role === 'TRAINER' ? { trainerProfile: {
      experienceYears: values.trainerProfile.experienceYears ?? null,
      specializations: nullableText(values.trainerProfile.specializations),
      methodology: nullableText(values.trainerProfile.methodology),
    } } : {}),
  }
}
