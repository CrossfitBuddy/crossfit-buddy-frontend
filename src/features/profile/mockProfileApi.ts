import { releaseMockAvatar } from './mockAvatars'
import type { ProfileApi, ProfileResponse } from './types'

export const initialProfile: ProfileResponse = {
  id: 'b4ba9b11-b755-4cd7-96af-fbaf515778fa',
  email: 'ivan@example.com',
  roles: ['ATHLETE', 'TRAINER'],
  activeRole: 'ATHLETE',
  firstName: 'Иван',
  lastName: 'Петров',
  birthDate: '1998-05-14',
  gender: 'MALE',
  city: 'Новосибирск',
  about: 'Тренируюсь три раза в неделю. Готовлюсь к первым соревнованиям.',
  avatarKey: null,
  athleteProfile: { heightCm: 180, weightKg: 78.5, fitnessLevel: 'INTERMEDIATE', rxPreference: 'SCALED' },
  trainerProfile: {
    specializations: 'Функциональный тренинг, силовая подготовка',
    experienceYears: 4,
    methodology: 'Постепенно увеличиваю нагрузку и уделяю внимание технике движений.',
  },
}

export function createMockProfileApi(options: { delay?: number; failLoad?: boolean; failSave?: boolean } = {}): ProfileApi {
  let profile = structuredClone(initialProfile)
  const wait = () => new Promise<void>((resolve) => setTimeout(resolve, options.delay ?? 600))

  return {
    async getProfile() {
      await wait()
      if (options.failLoad) throw new Error('Не удалось загрузить профиль. Попробуйте ещё раз.')
      return structuredClone(profile)
    },
    async updateProfile(request) {
      await wait()
      if (options.failSave) throw new Error('Не удалось сохранить изменения. Попробуйте ещё раз.')
      if (request.avatarKey !== profile.avatarKey) releaseMockAvatar(profile.avatarKey)
      profile = { ...profile, ...structuredClone(request) }
      return structuredClone(profile)
    },
    async switchRole(role) {
      await wait()
      if (!profile.roles.includes(role)) throw new Error('Эта роль недоступна.')
      profile = { ...profile, activeRole: role }
      return structuredClone(profile)
    },
  }
}

const scenario = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('profileScenario') : null
export const profileApi = createMockProfileApi({
  failLoad: scenario === 'load-error',
  failSave: scenario === 'save-error',
  delay: scenario === 'slow' ? 3000 : 600,
})
