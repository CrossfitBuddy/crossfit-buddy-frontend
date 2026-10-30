import { MailOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input } from 'antd'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authErrorMessage } from '../features/auth/authApi'
import { useRecovery } from '../features/auth/recoveryContext'

export function ForgotPasswordPage() {
  const { email, setEmail, api } = useRecovery()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const submit = async (values: { email: string }) => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      await api.requestCode(values.email)
      setEmail(values.email)
      navigate('/reset-password', { replace: true })
    } catch (error) { setError(authErrorMessage(error)) }
    finally { busy.current = false; setPending(false) }
  }
  return <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
    <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
    <h1 className="mt-3 text-4xl font-black">Восстановление пароля</h1>
    {error && <div role="alert" className="mt-6"><Alert type="error" showIcon title={error} /></div>}
    <div className="mt-6"><Form initialValues={{ email }} noValidate onSubmitCapture={(event) => { if (busy.current) { event.preventDefault(); event.stopPropagation() } }} layout="vertical" requiredMark={false} onFinish={submit} disabled={pending} onValuesChange={() => { if (!busy.current) setError('') }}>
      <Form.Item name="email" normalize={(value: string) => value.trim()} label={<span className="text-white">Email</span>} rules={[{ required: true, message: 'Введите email' }, { type: 'email', message: 'Введите корректный email' }, { max: 320, message: 'Максимум 320 символов' }]}>
        <Input prefix={<MailOutlined />} type="email" autoComplete="email" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block size="large" loading={pending}>{pending ? 'Отправляем…' : 'Отправить код'}</Button>
    </Form></div>
    <p className="mt-4 text-center"><Link to="/login" onClick={() => setEmail('')} className={pending ? 'pointer-events-none text-stone-400' : '!text-lime-400'} tabIndex={pending ? -1 : undefined}>Войти</Link></p>
  </main>
}
