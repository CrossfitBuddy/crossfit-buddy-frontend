import type { Rule } from 'antd/es/form'

export const profileNumberLimits = {
  heightCm: { integer: true, min: 0, max: 2147483647 },
  weightKg: { integer: false, min: 0, max: 9999.99 },
  experienceYears: { integer: true, min: 0, max: 2147483647 },
} as const

export function numberRules(field: keyof typeof profileNumberLimits): Rule[] {
  const limits = profileNumberLimits[field]
  return [{
    validator: (_, value: number | null | undefined) => {
      if (value == null) return Promise.resolve()
      if (!Number.isFinite(value) || value < limits.min || (field !== 'experienceYears' && value === 0)) {
        return Promise.reject(new Error(field === 'experienceYears' ? 'Введите число не меньше нуля' : 'Введите число больше нуля'))
      }
      if (limits.integer && !Number.isInteger(value)) return Promise.reject(new Error('Введите целое число'))
      if (value > limits.max) return Promise.reject(new Error('Слишком большое значение'))
      if (!limits.integer && Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
        return Promise.reject(new Error('Не более двух знаков после запятой'))
      }
      return Promise.resolve()
    },
  }]
}
