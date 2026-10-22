import {LockOutlined, MailOutlined} from '@ant-design/icons'
import {Alert, Button, Form, Input} from 'antd'
import {useState} from 'react'
import {Link, useLocation, useNavigate} from 'react-router-dom'
import {getApiErrorCode} from '../api/session'
import {useAuth} from '../app/auth/useAuth'
import './LoginPage.css'

type LoginValues = {
  email: string
  password: string
}

const whiteLabel = (text: string) => <span className="text-white">{text}</span>

const loginErrors: Record<string, string> = {
  INVALID_CREDENTIALS: 'Неверный email или пароль. Повторите попытку',
  ACCOUNT_DISABLED: 'Ваша учетная запись заблокирована. Обратитесь к администратору',
}

export function LoginPage() {
  const {signIn} = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (values: LoginValues) => {
    setLoading(true)
    setError(null)
    try {
      await signIn(values.email, values.password)
    } catch (reason) {
      const code = getApiErrorCode(reason)
      if (code === 'ROLE_NOT_ASSIGNED') {
        navigate('/role-not-assigned', {replace: true})
      } else {
        setError((code && loginErrors[code]) ?? 'Не удалось выполнить вход. Попробуйте позже')
      }
      setLoading(false)
      return
    }
    const from = location.state?.from
    navigate(from ? `${from.pathname}${from.search}${from.hash}` : '/', {replace: true})
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
      <p className="login-brand">CrossfitBuddy</p>
      <h1 className="login-title">Войти</h1>
      {error && <Alert type="error" showIcon title={error} className="!mt-6" />}
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
        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
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
