import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Form, Input } from 'antd'
import { Link } from 'react-router-dom'

type LoginValues = {
  email: string
  password: string
}

const whiteLabel = (text: string) => <span className="text-white">{text}</span>

export function LoginPage() {
  const submit = (values: LoginValues) => {
    void values
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
      <p className="text-sm font-bold text-lime-400">CrossfitBuddy</p>
      <h1 className="mt-2 text-4xl font-black">Войти</h1>
      <Form<LoginValues> layout="vertical" requiredMark={false} className="mt-8" onFinish={submit}>
        <Form.Item
          name="email"
          label={whiteLabel('Email')}
          rules={[
            { required: true, message: 'Введите email' },
            { type: 'email', message: 'Проверьте формат email' },
          ]}
        >
          <Input prefix={<MailOutlined />} type="email" placeholder="athlete@example.com" autoComplete="email" />
        </Form.Item>
        <Form.Item name="password" label={whiteLabel('Пароль')} rules={[{ required: true, message: 'Введите пароль' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="Пароль" autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large">
          Войти
        </Button>
      </Form>
      <p className="mt-4 text-center">
        <Link to="/reset-password" className="text-stone-300">
          Забыли пароль?
        </Link>
      </p>
      <p className="mt-2 text-center">
        <Link to="/register" className="font-bold text-lime-400">
          Зарегистрироваться
        </Link>
      </p>
    </main>
  )
}
