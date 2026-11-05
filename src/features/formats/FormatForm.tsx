import { Button, Form, Input, InputNumber } from 'antd'
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
      {format.duration !== null && (
        <Form.Item label="Длительность">
          <InputNumber className="!w-full" value={format.duration} disabled />
        </Form.Item>
      )}
      {format.interval !== null && (
        <Form.Item label="Интервал">
          <InputNumber className="!w-full" value={format.interval} disabled />
        </Form.Item>
      )}
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
