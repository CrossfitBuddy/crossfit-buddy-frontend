import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './app/ProtectedRoute'
import { RoleGate } from './app/RoleGate'
import { appRoutes } from './app/routes'
import { NotFoundPage } from './pages/ErrorPages'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        {appRoutes.map(({ path, roles, element }) => (
          <Route key={path} path={path} element={<RoleGate roles={roles}>{element}</RoleGate>} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
