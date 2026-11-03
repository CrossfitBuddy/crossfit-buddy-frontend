import { Alert, Button, Spin } from 'antd'
import { Navigate, useLocation } from 'react-router-dom'
import { MobileShell } from './MobileShell'
import { useAuth } from './auth/useAuth'

export function ProtectedRoute() {
  const { user, restoring, sessionError, retrySession, signOut } = useAuth()
  const location = useLocation()
  if (restoring) return <main className="mx-auto min-h-dvh max-w-md bg-[#101914] p-6 text-white" role="status"><Spin /> Проверяем сессию…</main>
  if (sessionError) return <main className="mx-auto min-h-dvh max-w-md bg-[#101914] p-6">
    <Alert type="error" showIcon title={sessionError} />
    <Button type="primary" block className="mt-5" onClick={retrySession}>Повторить</Button>
    <Button block className="mt-3" onClick={signOut}>Вернуться ко входу</Button>
  </main>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <MobileShell />
}
