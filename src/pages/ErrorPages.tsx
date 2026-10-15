import { Button } from 'antd'
import { Link } from 'react-router-dom'

type ErrorPageProps = {
  code: string
  title: string
  text: string
}

function ErrorPage({ code, title, text }: ErrorPageProps) {
  return (
    <div className="flex min-h-[70dvh] flex-col justify-center px-6">
      <p className="text-6xl font-black text-lime-600">{code}</p>
      <h1 className="mt-3 text-2xl font-black">{title}</h1>
      <p className="mt-2 text-stone-500">{text}</p>
      <Link to="/" className="mt-6">
        <Button type="primary" block size="large">На главную</Button>
      </Link>
    </div>
  )
}

export function ForbiddenPage() {
  return <ErrorPage code="403" title="Нет доступа" text="Этот раздел недоступен для вашей текущей роли" />
}

export function NotFoundPage() {
  return <ErrorPage code="404" title="Страница не найдена" text="Проверьте адрес или вернитесь на главную" />
}
