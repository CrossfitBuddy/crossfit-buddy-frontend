import type { Rule } from 'antd/es/form'

export const profileNumberLimits = {
  heightCm: { integer: true, min: 50, max: 250 },
  weightKg: { integer: false, min: 20, max: 500 },
  experienceYears: { integer: true, min: 0, max: 80 },
} as const

export function numberRules(field: keyof typeof profileNumberLimits): Rule[] {
  const limits = profileNumberLimits[field]
  return [{
    validator: (_, value: number | null | undefined) => {
      if (value == null) return Promise.resolve()
      if (!Number.isFinite(value) || value < limits.min || value > limits.max) {
        return Promise.reject(new Error(`Введите число от ${limits.min} до ${limits.max}`))
      }
      if (limits.integer && !Number.isInteger(value)) return Promise.reject(new Error('Введите целое число'))
      if (!limits.integer && Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
        return Promise.reject(new Error('Не более двух знаков после запятой'))
      }
      return Promise.resolve()
    },
  }]
}
