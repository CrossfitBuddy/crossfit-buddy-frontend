import { Button } from 'antd'
import { Link } from 'react-router-dom'

export function RoleNotAssignedPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#101914] px-6 py-10 text-white">
      <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
      <h1 className="mt-3 text-4xl font-black">Роль не назначена</h1>
      <p className="mt-4 text-stone-300">Для вашей учётной записи не назначена роль. Обратитесь к администратору.</p>
      <Link to="/login" className="mt-8">
        <Button type="primary" block size="large">Вернуться ко входу</Button>
      </Link>
    </main>
  )
}
