import { MailOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'

type ForgotPasswordValues = {
  email: string
}

export function ForgotPasswordPage() {
  const [codeSent, setCodeSent] = useState(false)

  const submit = () => {
    setCodeSent(true)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
      <p className="text-sm font-bold uppercase tracking-[0.24em] text-lime-400">CrossfitBuddy</p>
      <h1 className="mt-3 text-4xl font-black">Восстановление пароля</h1>

      {codeSent && <Alert type="success" showIcon title="Код отправлен" className="mt-6" />}

      <div className="mt-6">
        <Form<ForgotPasswordValues>
          layout="vertical"
          requiredMark={false}
          onFinish={submit}
          onValuesChange={() => setCodeSent(false)}
        >
          <Form.Item
            name="email"
            label={<span className="text-white">Email</span>}
            normalize={(value: string) => value.trim()}
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Проверьте формат email' },
            ]}
          >
            <Input prefix={<MailOutlined />} type="email" placeholder="athlete@example.com" autoComplete="email" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">Отправить код</Button>
        </Form>
      </div>

      <p className="mt-4 text-center">
        <Link to="/login" className="font-bold !text-lime-400">Войти</Link>
      </p>
    </main>
  )
}
