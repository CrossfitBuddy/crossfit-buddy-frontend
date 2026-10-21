import {LockOutlined, MailOutlined} from '@ant-design/icons'
import {Button, Form, Input} from 'antd'
import {Link, useLocation, useNavigate} from 'react-router-dom'
import {useAuth} from '../app/auth/useAuth'
import './LoginPage.css'

type LoginValues = {
  email: string
  password: string
}

const whiteLabel = (text: string) => <span className="text-white">{text}</span>

export function LoginPage() {
  const {signIn} = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const submit = (values: LoginValues) => {
    signIn(values.email)
    const from = location.state?.from
    navigate(from ? `${from.pathname}${from.search}${from.hash}` : '/', {replace: true})
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
      <p className="login-brand">CrossfitBuddy</p>
      <h1 className="login-title">Войти</h1>
      <Form<LoginValues> layout="vertical" requiredMark={false} className="login-form" onFinish={submit}>
        <Form.Item
          name="email"
          label={whiteLabel('Email')}
          rules={[
            {required: true, message: 'Введите email'},
            {type: 'email', message: 'Проверьте формат email'},
          ]}
        >
          <Input prefix={<MailOutlined/>} type="email" placeholder="athlete@example.com" autoComplete="email"/>
        </Form.Item>
        <Form.Item name="password" label={whiteLabel('Пароль')} rules={[{required: true, message: 'Введите пароль'}]}>
          <Input.Password prefix={<LockOutlined/>} placeholder="Пароль" autoComplete="current-password"/>
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large">
          Войти
        </Button>
      </Form>
      <p className="mt-4 text-center">
        <Link to="/forgot-password" className="login-link login-link--secondary">
          Забыли пароль?
        </Link>
      </p>
      <p className="mt-2 text-center">
        <Link to="/register" className="login-link login-link--primary">
          Зарегистрироваться
        </Link>
      </p>
    </main>
  )
}
