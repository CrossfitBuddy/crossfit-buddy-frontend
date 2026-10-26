import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './app/ProtectedRoute'
import { RoleGate } from './app/RoleGate'
import { appRoutes } from './app/routes'
import { EmailConfirmationPage } from './pages/EmailConfirmationPage'
import { NotFoundPage } from './pages/ErrorPages'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { RoleNotAssignedPage } from './pages/RoleNotAssignedPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/email-confirmation" element={<EmailConfirmationPage />} />
      <Route path="/role-not-assigned" element={<RoleNotAssignedPage />} />
      <Route element={<ProtectedRoute />}>
        {appRoutes.map(({ path, roles, element }) => (
          <Route key={path} path={path} element={<RoleGate roles={roles}>{element}</RoleGate>} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
