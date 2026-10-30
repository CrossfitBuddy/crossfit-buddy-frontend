import { AutoComplete, Button, Form, Input, Select } from 'antd'
import type { FormInstance } from 'antd'
import { Plus, Trash2 } from 'lucide-react'
import { hasDuplicate, requiredRule, unitRules } from './exerciseValidation'
import type { Measure } from './types'

const valueTypeOptions = [
  { value: 'INTEGER', label: 'Целое число' },
  { value: 'DECIMAL', label: 'Вещественное число' },
]

type MeasureListProps = {
  form: FormInstance
  name: (string | number)[]
  path: (string | number)[]
  nameLabel: string
  duplicateMessage: string
  addLabel: string
  removeLabel: string
  suggestions?: Measure[]
}

export function MeasureList({ form, name, path, nameLabel, duplicateMessage, addLabel, removeLabel, suggestions = [] }: MeasureListProps) {
  const fillFromSuggestion = (index: number, value: string) => {
    const suggestion = suggestions.find((item) => item.name === value)
    if (!suggestion) return
    form.setFieldValue([...path, index, 'valueType'], suggestion.valueType)
    form.setFieldValue([...path, index, 'unit'], suggestion.unit)
  }

  const revalidateNames = () => {
    const names = form.getFieldsError()
      .filter(({ name, errors }) => errors.length > 0
        && name.length === path.length + 2
        && path.every((part, index) => name[index] === part)
        && name[name.length - 1] === 'name')
      .map(({ name }) => name)
    if (names.length) form.validateFields(names).catch(() => undefined)
  }

  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.key} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex items-start gap-2">
                <Form.Item
                  className="min-w-0 flex-1"
                  name={[field.name, 'name']}
                  label={nameLabel}
                  dependencies={fields.map((item) => [...path, item.name, 'name'])}
                  rules={[
                    requiredRule(nameLabel),
                    {
                      validator: (_, value: string) => !value || !hasDuplicate(form.getFieldValue(path), field.name)
                        ? Promise.resolve()
                        : Promise.reject(new Error(duplicateMessage)),
                    },
                  ]}
                >
                  <AutoComplete
                    options={suggestions.map((item) => ({ value: item.name }))}
                    filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
                    onSelect={(value: string) => fillFromSuggestion(field.name, value)}
                  />
                </Form.Item>
                <Button
                  type="text"
                  danger
                  className="mt-[30px]"
                  aria-label={removeLabel}
                  icon={<Trash2 size={18} />}
                  onClick={() => {
                    remove(field.name)
                    revalidateNames()
                  }}
                />
              </div>
              <div className="grid grid-cols-2 items-end gap-3">
                <Form.Item name={[field.name, 'valueType']} label="Тип значения" rules={[requiredRule('Тип значения')]}>
                  <Select options={valueTypeOptions} placeholder="Выберите" />
                </Form.Item>
                <Form.Item name={[field.name, 'unit']} label="Единица измерения" rules={unitRules('Единица измерения')}>
                  <Input />
                </Form.Item>
              </div>
            </div>
          ))}
          <Button block icon={<Plus size={18} />} onClick={() => add({ name: '', unit: '' })}>
            {addLabel}
          </Button>
        </div>
      )}
    </Form.List>
  )
}
