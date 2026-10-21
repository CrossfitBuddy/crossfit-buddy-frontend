import { describe, expect, it } from 'vitest'
import { numberRules } from './profileValidation'

type NumberField = Parameters<typeof numberRules>[0]

async function validate(field: NumberField, value: number | null | undefined) {
  const rule = numberRules(field)[0]
  if (typeof rule !== 'object' || !rule.validator) throw new Error('Не найдено правило проверки')
  return rule.validator(rule, value, () => {})
}

describe('Ограничения числовых полей профиля', () => {
  it.each<[NumberField, number]>([
    ['heightCm', 50], ['heightCm', 250],
    ['weightKg', 20], ['weightKg', 500], ['weightKg', 78.55],
    ['experienceYears', 0], ['experienceYears', 80],
  ])('принимает допустимое значение %s: %s', async (field, value) => {
    await expect(validate(field, value)).resolves.toBeUndefined()
  })

  it.each<[NumberField, number]>([
    ['heightCm', 49], ['heightCm', 251], ['heightCm', 180.5],
    ['weightKg', 19.99], ['weightKg', 500.01], ['weightKg', 78.123],
    ['experienceYears', -1], ['experienceYears', 81], ['experienceYears', 1.5],
    ['heightCm', Infinity], ['weightKg', NaN],
  ])('отклоняет недопустимое значение %s: %s', async (field, value) => {
    await expect(validate(field, value)).rejects.toThrow()
  })

  it.each<NumberField>(['heightCm', 'weightKg', 'experienceYears'])('разрешает не заполнять %s', async (field) => {
    await expect(validate(field, null)).resolves.toBeUndefined()
    await expect(validate(field, undefined)).resolves.toBeUndefined()
  })
})
