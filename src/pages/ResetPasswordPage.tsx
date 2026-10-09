import { LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'

type ResetPasswordValues = {
  code: string
  password: string
  confirmPassword: string
}

type Status = { type: 'error' | 'success' | 'info'; message: string }

const VALID_CODE = '123456'

const whiteLabel = (text: string) => <span className="text-white">{text}</span>

export function ResetPasswordPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [form] = Form.useForm<ResetPasswordValues>()

  const submit = (values: ResetPasswordValues) => {
    if (values.code.trim() !== VALID_CODE) {
      setStatus({ type: 'error', message: 'Неверный код подтверждения' })
      return
    }
    setStatus({ type: 'success', message: 'Пароль успешно изменён' })
    form.resetFields()
  }

  const resendCode = () => {
    setStatus({ type: 'info', message: 'Код отправлен повторно' })
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
      <p className="flex gap-[0.8em] text-sm font-bold uppercase tracking-[0.24em] text-lime-400">
        <span>Crossfit</span>
        <span>Buddy</span>
      </p>
      <h1 className="mt-3 text-4xl font-black">Смена пароля</h1>

      {status && <Alert type={status.type} showIcon title={status.message} className="mt-6" />}

      <div className="mt-6">
        <Form<ResetPasswordValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={submit}
          onValuesChange={() => setStatus(null)}
        >
          <Form.Item
            name="code"
            label={whiteLabel('Код из письма')}
            rules={[{ required: true, whitespace: true, message: 'Введите код' }]}
          >
            <Input prefix={<SafetyOutlined />} placeholder="123456" inputMode="numeric" autoComplete="one-time-code" />
          </Form.Item>

          <Form.Item
            name="password"
            label={whiteLabel('Новый пароль')}
            rules={[{ required: true, message: 'Введите новый пароль' }, { min: 8, message: 'Минимум 8 символов' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Минимум 8 символов" autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={whiteLabel('Подтверждение пароля')}
            dependencies={['password']}
            rules={[
              { required: true, message: 'Повторите пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Введённые пароли не совпадают'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Повторите пароль" autoComplete="new-password" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">Сменить пароль</Button>
        </Form>
      </div>

      <Button ghost block size="large" className="mt-3" onClick={resendCode}>Отправить код ещё раз</Button>
      <p className="mt-4 text-center">
        <Link to="/login" className="font-bold !text-lime-400">Войти</Link>
      </p>
    </main>
  )
}
