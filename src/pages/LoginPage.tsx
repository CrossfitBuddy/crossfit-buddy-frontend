import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Form, Input } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../app/auth/useAuth'

type LoginValues = {
  email: string
  password: string
}

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const submit = (values: LoginValues) => {
    signIn(values.email)
    const from = location.state?.from
    navigate(from ? `${from.pathname}${from.search}${from.hash}` : '/', { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 text-white">
      <p className="text-sm font-bold uppercase tracking-[0.24em] text-lime-400">CrossfitBuddy</p>
      <h1 className="mt-3 text-4xl font-black">Войти</h1>
      <Form<LoginValues> layout="vertical" requiredMark={false} className="mt-8" onFinish={submit}>
        <Form.Item name="email" label={<span className="text-white">Email</span>} rules={[{ required: true, message: 'Введите email' }, { type: 'email', message: 'Проверьте формат email' }]}>
          <Input prefix={<MailOutlined />} type="email" placeholder="athlete@example.com" autoComplete="email" />
        </Form.Item>
        <Form.Item name="password" label={<span className="text-white">Пароль</span>} rules={[{ required: true, message: 'Введите пароль' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="Пароль" autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large">Продолжить</Button>
        <Button type="link" block className="mt-2 !text-stone-300">Забыли пароль?</Button>
      </Form>
    </main>
  )
}
