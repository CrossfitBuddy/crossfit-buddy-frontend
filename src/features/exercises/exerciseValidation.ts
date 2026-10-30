import type { Rule } from 'antd/es/form'
import type { Measure } from './types'

export const IMAGE_TYPES = ['image/jpeg', 'image/png']

export const requiredRule = (label: string): Rule => ({
  required: true,
  whitespace: true,
  message: `Поле "${label}" обязательно для заполнения`,
})

export const unitRules = (label: string): Rule[] => [
  requiredRule(label),
  { pattern: /^\p{L}+$/u, message: 'Только буквы' },
]

const normalize = (value: string | undefined) => (value ?? '').trim().toLowerCase()

export const hasDuplicate = (items: Partial<Measure>[] | undefined, index: number) => {
  const name = normalize(items?.[index]?.name)
  if (!name) return false
  return (items ?? []).some((item, other) => other !== index && normalize(item?.name) === name)
}
