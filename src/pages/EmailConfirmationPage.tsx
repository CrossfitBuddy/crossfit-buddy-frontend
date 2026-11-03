import { MailOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, Button, Form, Input, Spin } from 'antd'
import { isAxiosError } from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { confirmEmail, resendConfirmationEmail } from '../api/auth'

type ResendValues = {
  email: string
}

const isExpired = (error: unknown) => isAxiosError(error) && error.response?.status === 410
const isTemporaryError = (error: unknown) => isAxiosError(error) && (!error.response || error.response.status >= 500)

function ResendForm() {
  const resend = useMutation({ mutationFn: resendConfirmationEmail })

  const submit = (values: ResendValues) => {
    if (resend.isPending) return
    resend.mutate(values.email.trim())
  }

  return (
    <div className="mt-6">
      {resend.isSuccess && <div className="mb-6"><Alert type="success" showIcon title="Письмо отправлено, проверьте почту" /></div>}
      {resend.isError && <div className="mb-6"><Alert type="error" showIcon title="Не удалось отправить письмо. Попробуйте ещё раз" /></div>}
      <Form<ResendValues>
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
        onValuesChange={() => {
          if (!resend.isPending) resend.reset()
        }}
      >
        <Form.Item
          name="email"
          label={<span className="text-white">Email</span>}
          rules={[{ required: true, message: 'Введите email' }, { type: 'email', message: 'Проверьте формат email' }]}
        >
          <Input prefix={<MailOutlined />} type="email" placeholder="athlete@example.com" autoComplete="email" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large" loading={resend.isPending}>Отправить письмо ещё раз</Button>
      </Form>
    </div>
  )
}

export function EmailConfirmationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const confirmation = useQuery({
    queryKey: ['email-confirmation', token],
    queryFn: () => confirmEmail(token!).then(() => true),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  })

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
      <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">Подтверждение email</h1>

      {token && confirmation.isPending && (
        <div role="status" className="mt-6 flex items-center gap-3 text-stone-300">
          <Spin />
          <span>Подтверждаем email…</span>
        </div>
      )}

      {confirmation.isSuccess && (
        <>
          <div className="mt-6"><Alert type="success" showIcon title="Email подтверждён" /></div>
          <Button type="primary" block size="large" className="mt-6" onClick={() => navigate('/login')}>Перейти ко входу</Button>
        </>
      )}

      {confirmation.isError && isExpired(confirmation.error) && (
        <>
          <div className="mt-6"><Alert type="warning" showIcon title="Ссылка больше не действует" description="Она уже использована или устарела. Введите email, и мы отправим новое письмо" /></div>
          <ResendForm />
        </>
      )}

      {confirmation.isError && isTemporaryError(confirmation.error) && (
        <>
          <div className="mt-6"><Alert type="error" showIcon title="Сервер временно недоступен" description="Ссылка при этом может быть рабочей. Попробуйте ещё раз" /></div>
          <Button type="primary" block size="large" className="mt-6" loading={confirmation.isFetching} onClick={() => void confirmation.refetch()}>Повторить</Button>
        </>
      )}

      {(!token || (confirmation.isError && !isExpired(confirmation.error) && !isTemporaryError(confirmation.error))) && (
        <>
          <div className="mt-6"><Alert type="error" showIcon title="Не удалось подтвердить email" description="Ссылка недействительна. Запросите новое письмо" /></div>
          <ResendForm />
        </>
      )}
    </main>
  )
}
