import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Form, Input, Select } from 'antd'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, type UserRole } from '../api/auth'

type RegisterValues = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
}

const roleOptions = [
  { value: 'ATHLETE', label: 'Атлет' },
  { value: 'TRAINER', label: 'Тренер' },
]

const whiteLabel = (text: string) => <span className="text-white">{text}</span>

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    if (!error.response) return 'Не удалось связаться с сервером. Попробуйте ещё раз'
    if (error.response.status === 409) return 'Пользователь с таким email уже зарегистрирован'
  }
  return 'Не удалось зарегистрироваться. Попробуйте ещё раз'
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const register = useMutation({ mutationFn: registerUser })

  const submit = (values: RegisterValues) => {
    if (register.isPending) return
    const email = values.email.trim()
    register.mutate(
      {
        email,
        password: values.password,
        displayName: `${values.firstName.trim()} ${values.lastName.trim()}`,
        role: values.role,
      },
      { onSuccess: () => setSentTo(email) },
    )
  }

  if (sentTo) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
        <p className="text-sm font-bold text-lime-400">CrossfitBuddy</p>
        <h1 className="mt-2 text-4xl font-black">Проверьте почту</h1>
        <p className="mt-4 text-stone-300">
          Мы отправили письмо на <span className="font-bold text-white">{sentTo}</span>. Перейдите по ссылке из письма, чтобы подтвердить аккаунт.
        </p>
        <Button type="primary" block size="large" className="mt-8" onClick={() => navigate('/login')}>Перейти ко входу</Button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
      <p className="text-sm font-bold text-lime-400">CrossfitBuddy</p>
      <h1 className="mt-2 text-4xl font-black">Регистрация</h1>

      {register.isError && <div className="mt-6"><Alert type="error" showIcon title={getErrorMessage(register.error)} /></div>}

      <div className="mt-6">
        <Form<RegisterValues>
          layout="vertical"
          requiredMark={false}
          onFinish={submit}
          onValuesChange={() => {
            if (!register.isPending) register.reset()
          }}
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
            <Select<UserRole> placeholder="Выберите роль" options={roleOptions} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large" loading={register.isPending}>Зарегистрироваться</Button>
        </Form>
      </div>

      <p className="mt-4 text-center text-stone-300">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-bold !text-lime-400">Войти</Link>
      </p>
    </main>
  )
}
