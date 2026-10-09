import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input, Select } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'

type Role = 'ATHLETE' | 'TRAINER'

type RegisterValues = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  role: Role
}

const TAKEN_EMAILS = ['ivan@example.com']

const roleOptions = [
  { value: 'ATHLETE', label: 'Атлет' },
  { value: 'TRAINER', label: 'Тренер' },
]

const whiteLabel = (text: string) => <span className="text-white">{text}</span>

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const submit = (values: RegisterValues) => {
    if (TAKEN_EMAILS.includes(values.email.trim().toLowerCase())) {
      setError('Пользователь с таким email уже зарегистрирован')
      setSuccess(false)
      return
    }
    setError(null)
    setSuccess(true)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
      <p className="text-sm font-bold text-lime-400">CrossfitBuddy</p>
      <h1 className="mt-2 text-4xl font-black">Регистрация</h1>

      {error && <div className="mt-6"><Alert type="error" showIcon title={error} /></div>}
      {success && <div className="mt-6"><Alert type="success" showIcon title="Аккаунт создан" /></div>}

      <div className="mt-6">
        <Form<RegisterValues>
          layout="vertical"
          requiredMark={false}
          onFinish={submit}
          onValuesChange={() => setError(null)}
        >
          <Form.Item name="firstName" label={whiteLabel('Имя')} rules={[{ required: true, whitespace: true, message: 'Введите имя' }]}>
            <Input prefix={<UserOutlined />} placeholder="Иван" autoComplete="given-name" />
          </Form.Item>

          <Form.Item name="lastName" label={whiteLabel('Фамилия')} rules={[{ required: true, whitespace: true, message: 'Введите фамилию' }]}>
            <Input prefix={<UserOutlined />} placeholder="Петров" autoComplete="family-name" />
          </Form.Item>

          <Form.Item
            name="email"
            label={whiteLabel('Email')}
            rules={[{ required: true, message: 'Введите email' }, { type: 'email', message: 'Проверьте формат email' }]}
          >
            <Input prefix={<MailOutlined />} type="email" placeholder="athlete@example.com" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label={whiteLabel('Пароль')}
            rules={[{ required: true, message: 'Введите пароль' }, { min: 8, message: 'Минимум 8 символов' }]}
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

          <Form.Item name="role" label={whiteLabel('Роль')} rules={[{ required: true, message: 'Выберите роль' }]}>
            <Select<Role> placeholder="Выберите роль" options={roleOptions} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">Зарегистрироваться</Button>
        </Form>
      </div>

      <p className="mt-4 text-center text-stone-300">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-bold !text-lime-400">Войти</Link>
      </p>
    </main>
  )
}