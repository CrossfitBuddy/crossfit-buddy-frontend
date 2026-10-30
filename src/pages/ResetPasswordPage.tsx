import { LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input } from 'antd'
import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthError, authErrorMessage } from '../features/auth/authApi'
import { useRecovery } from '../features/auth/recoveryContext'
import { isStrongPassword, passwordHint } from '../features/auth/validation'

type Values = { code: string; password: string; passwordConfirmation: string }
const label = (text: string) => <span className="text-white">{text}</span>

export function ResetPasswordPage() {
  const { email, setEmail, api } = useRecovery()
  const navigate = useNavigate()
  const [form] = Form.useForm<Values>()
  const [pending, setPending] = useState<'save' | 'resend' | null>(null)
  const [errorCode, setErrorCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('Код восстановления отправлен на указанный email')
  const busy = useRef(false)
  const [completed, setCompleted] = useState(false)
  if (!email && !completed) return <Navigate to="/forgot-password" replace />

  const submit = async (values: Values) => {
    if (busy.current) return
    busy.current = true
    setPending('save')
    setError('')
    setNotice('')
    try {
      await api.resetPassword({ email, ...values })
      form.resetFields()
      setCompleted(true)
      setEmail('')
      navigate('/login', { replace: true, state: { passwordChanged: true } })
    } catch (error) {
      const code = error instanceof AuthError ? error.code : ''
      setErrorCode(code)
      setError(authErrorMessage(error))
      const field = code === 'INVALID_CODE' ? 'code' : ['WEAK_PASSWORD', 'PASSWORD_MISMATCH'].includes(code) ? 'password' : null
      if (field) form.setFields([{ name: field, errors: [authErrorMessage(error)] }])
      if (code === 'PASSWORD_MISMATCH') form.setFields([{ name: 'passwordConfirmation', errors: [authErrorMessage(error)] }])
    } finally { busy.current = false; setPending(null) }
  }

  const resend = async () => {
    if (busy.current) return
    busy.current = true
    setPending('resend')
    setError('')
    setNotice('')
    try {
      await api.requestCode(email)
      form.resetFields(['code'])
      setErrorCode('')
      setNotice('Код восстановления отправлен на указанный email')
    } catch (error) { setError(authErrorMessage(error)) }
    finally { busy.current = false; setPending(null) }
  }

  return <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
    <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
    <h1 className="mt-3 text-4xl font-black">Смена пароля</h1>
    {notice && <div role="status" className="mt-6"><Alert type="info" showIcon title={notice} /></div>}
    {error && <div role="alert" className="mt-6"><Alert type="error" showIcon title={error} /></div>}
    <div className="mt-6"><Form<Values> form={form} noValidate onSubmitCapture={(event) => { if (busy.current) { event.preventDefault(); event.stopPropagation() } }} layout="vertical" requiredMark={false} disabled={pending !== null} onFinish={submit} onFinishFailed={({ errorFields }) => { setNotice(''); setError(errorFields[0]?.errors[0] ?? '') }} onValuesChange={() => { if (!busy.current) { setError(''); setNotice('') } }}>
      <Form.Item name="code" label={label('Код из письма')} rules={[{ required: true, message: 'Введите код восстановления' }, { pattern: /^\d{6}$/, message: 'Код должен содержать ровно 6 цифр' }]}>
        <Input prefix={<SafetyOutlined />} inputMode="numeric" autoComplete="one-time-code" />
      </Form.Item>
      <Form.Item name="password" label={label('Новый пароль')} dependencies={['passwordConfirmation']} extra={<span className="text-stone-400">{passwordHint}</span>} rules={[
        { required: true, message: 'Введите новый пароль' },
        { validator: (_, value: string) => !value || isStrongPassword(value) ? Promise.resolve() : Promise.reject(new Error(authErrorMessage(new AuthError('WEAK_PASSWORD')))) },
        ({ getFieldValue }) => ({ validator: (_, value: string) => !value || !getFieldValue('passwordConfirmation') || value === getFieldValue('passwordConfirmation') ? Promise.resolve() : Promise.reject(new Error('Введенные пароли не совпадают')) }),
      ]}>
        <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
      </Form.Item>
      <Form.Item name="passwordConfirmation" label={label('Подтверждение пароля')} dependencies={['password']} rules={[
        { required: true, message: 'Повторите пароль' },
        ({ getFieldValue }) => ({ validator: (_, value: string) => !value || value === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('Введенные пароли не совпадают')) }),
      ]}>
        <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block size="large" loading={pending === 'save'} disabled={pending !== null}>{pending === 'save' ? 'Сохраняем…' : 'Сменить пароль'}</Button>
    </Form></div>
    <Button ghost block size="large" className={'mt-3 ' + (['CODE_EXPIRED', 'TOO_MANY_ATTEMPTS'].includes(errorCode) ? '!border-red-400 !text-red-400' : '')} loading={pending === 'resend'} disabled={pending !== null} onClick={() => void resend()}>Отправить код ещё раз</Button>
    <Button type="link" block className="mt-3 !text-lime-400" disabled={pending !== null} onClick={() => { form.resetFields(); navigate('/forgot-password', { replace: true }) }}>Вернуться к вводу email</Button>
    <Button type="link" block className="!text-lime-400" disabled={pending !== null} onClick={() => { form.resetFields(); setEmail(''); navigate('/login', { replace: true }) }}>Войти</Button>
  </main>
}
