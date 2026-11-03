import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../../App'
import { AuthProvider } from './AuthProvider'
import { writeSession } from './sessionStorage'
import type { AuthSession } from './types'

const initial: AuthSession = { accessToken: 'old-token', tokenType: 'Bearer', expiresAt: '2099-01-01T00:00:00Z', user: { id: 'test-account', email: 'ivan@example.com', displayName: 'Иван Петров', roles: ['ATHLETE', 'TRAINER'], activeRole: 'TRAINER' } }
const api = { account: async () => initial.user, switchRole: async () => initial, login: async (email: string) => ({ ...initial, user: { ...initial.user, email, roles: ['ATHLETE' as const], activeRole: 'ATHLETE' as const } }) }

function BackButton() {
  const navigate = useNavigate()
  return <button type="button" onClick={() => navigate(-1)}>Назад</button>
}

function renderApp(queryClient: QueryClient) {
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider api={api}>
        <MemoryRouter initialEntries={['/', '/profile']} initialIndex={1}>
          <BackButton />
          <App />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('Выход из аккаунта', () => {
  beforeEach(() => {
    localStorage.clear()
    writeSession(initial)
    localStorage.setItem('cb-last-role', 'TRAINER')
  })

  it('очищает данные сеанса и не пускает назад на защищённый экран', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['profile'], { secret: true })
    const user = userEvent.setup()
    renderApp(queryClient)

    await user.click(await screen.findByRole('button', { name: 'Выйти' }))

    expect(await screen.findByRole('heading', { name: 'Войти' })).toBeInTheDocument()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('cb-session')).toBeNull()
    expect(localStorage.getItem('cb-last-role')).toBeNull()
    expect(queryClient.getQueryData(['profile'])).toBeUndefined()

    await user.click(screen.getByRole('button', { name: 'Назад' }))

    expect(await screen.findByRole('heading', { name: 'Войти' })).toBeInTheDocument()
    expect(screen.queryByText('ivan@example.com')).not.toBeInTheDocument()
  })

  it('после выхода другой пользователь входит без данных прошлого сеанса', async () => {
    const user = userEvent.setup()
    renderApp(new QueryClient())

    await user.click(await screen.findByRole('button', { name: 'Выйти' }))
    await user.type(screen.getByLabelText('Email'), 'athlete@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'password{Enter}')
    await user.click(await screen.findByRole('link', { name: 'Профиль' }))

    expect(await screen.findByText('athlete@example.com')).toBeInTheDocument()
    expect(screen.queryByText('ivan@example.com')).not.toBeInTheDocument()
    expect(screen.getByText('Атлет')).toBeInTheDocument()
  })
})
