import { Button, Form, Input } from 'antd'
import type { ComplexFormat } from './types'

type FormatFormProps = {
  format: ComplexFormat
  saving: boolean
  onSave: (description: string) => void
  onCancel: () => void
}

type FormatValues = {
  description: string
}

export function FormatForm({ format, saving, onSave, onCancel }: FormatFormProps) {
  return (
    <Form<FormatValues>
      layout="vertical"
      requiredMark={false}
      initialValues={{ description: format.description }}
      disabled={saving}
      onFinish={(values) => onSave(values.description.trim())}
    >
      <dl className="mb-6 grid gap-2 text-sm">
        <div className="flex gap-2">
          <dt className="font-semibold">Длительность</dt>
          <dd>{format.durationRequired ? 'Обязательна' : 'Необязательна'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold">Интервал</dt>
          <dd>{format.intervalRequired ? 'Обязателен' : 'Необязателен'}</dd>
        </div>
      </dl>
      <Form.Item
        name="description"
        label="Описание"
        rules={[{ required: true, whitespace: true, message: 'Поле "Описание" обязательно для заполнения' }]}
      >
        <Input.TextArea autoSize={{ minRows: 4, maxRows: 12 }} />
      </Form.Item>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button size="large" onClick={onCancel}>Отмена</Button>
        <Button type="primary" htmlType="submit" size="large" loading={saving}>Сохранить</Button>
      </div>
    </Form>
  )
}
