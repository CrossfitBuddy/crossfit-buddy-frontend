import { describe, expect, it } from 'vitest'
import { createMockProfileApi, initialProfile } from './mockProfileApi'
import { isValidBirthDate, toFormValues, toUpdateRequest } from './profileValues'

describe('Контракт mock-профиля', () => {
  it('сохранение одной роли сохраняет профиль другой; форма не меняет исходные данные', async () => {
    const api = createMockProfileApi({ delay: 0 })
    const profile = await api.getProfile()
    const values = toFormValues(profile)
    values.athleteProfile.heightCm = 190
    expect(profile.athleteProfile?.heightCm).toBe(180)
    const saved = await api.updateProfile(toUpdateRequest(values, 'ATHLETE'))
    expect(saved.athleteProfile?.heightCm).toBe(190)
    expect(saved.trainerProfile).toEqual(initialProfile.trainerProfile)
    const trainer = await api.switchRole('TRAINER')
    expect(trainer.activeRole).toBe('TRAINER')
    expect(trainer.athleteProfile?.heightCm).toBe(190)
    await expect(api.switchRole('ADMIN')).rejects.toThrow('недоступна')
  })

  it('обрабатывает незаполненные поля и отправляет только активную роль', () => {
    const values = toFormValues({ ...initialProfile, athleteProfile: null, trainerProfile: null })
    values.city = '   '
    const request = toUpdateRequest(values, 'TRAINER')
    expect(request.city).toBeNull()
    expect(request.trainerProfile).toEqual({ specializations: null, methodology: null, experienceYears: null })
    expect(request).not.toHaveProperty('athleteProfile')
  })

  it('отклоняет невозможную и будущую дату рождения', () => {
    expect(isValidBirthDate('2000-02-29')).toBe(true)
    expect(isValidBirthDate('2001-02-29')).toBe(false)
    expect(isValidBirthDate('2999-01-01')).toBe(false)
    expect(isValidBirthDate('wrong')).toBe(false)
  })

  it('ошибка mock-сохранения не изменяет профиль', async () => {
    const api = createMockProfileApi({ delay: 0, failSave: true })
    const request = toUpdateRequest({ ...toFormValues(initialProfile), firstName: 'Другое' }, 'ATHLETE')
    await expect(api.updateProfile(request)).rejects.toThrow('сохранить')
    expect(await api.getProfile()).toEqual(initialProfile)
  })

})
