import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input } from 'antd'
import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../app/auth/useAuth'
import { AuthError, authErrorMessage } from '../features/auth/authApi'
import { returnAddress } from '../features/auth/validation'
import './LoginPage.css'

type LoginValues = { email: string; password: string }

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm<LoginValues>()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)

  const submit = async (values: LoginValues) => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      await signIn(values.email, values.password)
      form.resetFields(['password'])
      navigate(returnAddress(location.state?.from), { replace: true })
    } catch (error) {
      if (error instanceof AuthError && error.code === 'ROLE_NOT_ASSIGNED') navigate('/role-not-assigned', { replace: true })
      else setError(authErrorMessage(error))
    }
    finally { busy.current = false; setPending(false) }
  }

  return <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
    <p className="login-brand">CrossfitBuddy</p>
    <h1 className="login-title">Войти</h1>
    {location.state?.passwordChanged && <div role="status" className="mt-6"><Alert type="success" showIcon title="Пароль успешно изменен. Вы можете войти в систему с новым паролем" /></div>}
    {error && <div role="alert" className="mt-6"><Alert type="error" showIcon title={error} /></div>}
    <div className="mt-6">
      <Form<LoginValues> form={form} noValidate onSubmitCapture={(event) => { if (busy.current) { event.preventDefault(); event.stopPropagation() } }} layout="vertical" requiredMark={false} onFinish={submit} disabled={pending} onValuesChange={() => { if (!busy.current) setError('') }}>
        <Form.Item name="email" normalize={(value: string) => value.trim()} label={<span className="text-white">Email</span>} rules={[{ required: true, message: 'Введите email' }, { type: 'email', message: 'Введите корректный email' }, { max: 320, message: 'Максимум 320 символов' }]}>
          <Input prefix={<MailOutlined />} type="email" placeholder="athlete@example.com" autoComplete="email" />
        </Form.Item>
        <Form.Item name="password" label={<span className="text-white">Пароль</span>} rules={[{ required: true, whitespace: true, message: 'Введите пароль' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="Пароль" autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large" loading={pending}>{pending ? 'Входим…' : 'Войти'}</Button>
      </Form>
    </div>
    <p className="mt-4 text-center"><Link to="/forgot-password" className={pending ? 'pointer-events-none text-stone-400' : 'login-link login-link--secondary'} tabIndex={pending ? -1 : undefined}>Забыли пароль?</Link></p>
    <p className="mt-2 text-center"><Link to="/register" className={pending ? 'pointer-events-none text-stone-400' : 'login-link login-link--primary'} tabIndex={pending ? -1 : undefined}>Зарегистрироваться</Link></p>
  </main>
}
