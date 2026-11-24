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
      <Form.Item
        name="description"
        label="Описание"
        rules={[
          { required: true, whitespace: true, message: 'Поле "Описание" обязательно для заполнения' },
          { max: 2000, message: 'Не более 2000 символов' },
        ]}
      >
        <Input.TextArea maxLength={2000} autoSize={{ minRows: 4, maxRows: 12 }} />
      </Form.Item>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button size="large" onClick={onCancel}>Отмена</Button>
        <Button type="primary" htmlType="submit" size="large" loading={saving}>Сохранить</Button>
      </div>
    </Form>
  )
}
