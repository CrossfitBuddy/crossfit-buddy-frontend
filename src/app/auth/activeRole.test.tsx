import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { switchActiveRole } from '../../api/session'
import type { AuthResponse } from '../../api/session'
import { App } from '../../App'
import { AuthProvider } from './AuthProvider'
import type { UserRole } from './types'

vi.mock('../../api/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/session')>()),
  switchActiveRole: vi.fn(),
}))

function seedSession(roles: UserRole[], activeRole: UserRole) {
  localStorage.setItem('accessToken', 'old-token')
  localStorage.setItem('cb-session', JSON.stringify({
    user: { id: '1', email: 'ivan@example.com', displayName: 'Иван Петров', roles },
    activeRole,
  }))
}

function renderProfile() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AntApp>
        <AuthProvider>
          <MemoryRouter initialEntries={['/profile']}>
            <App />
          </MemoryRouter>
        </AuthProvider>
      </AntApp>
    </QueryClientProvider>,
  )
}

const trainerResponse: AuthResponse = {
  accessToken: 'new-token',
  tokenType: 'Bearer',
  expiresAt: '2030-01-01T00:00:00Z',
  user: { id: '1', email: 'ivan@example.com', displayName: 'Иван Петров', roles: ['ATHLETE', 'TRAINER'], activeRole: 'TRAINER' },
}

describe('Переключение активной роли', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(switchActiveRole).mockReset()
  })

  it('меняет роль через API, заменяет токен и перестраивает меню', async () => {
    seedSession(['ATHLETE', 'TRAINER'], 'ATHLETE')
    vi.mocked(switchActiveRole).mockResolvedValue({
      accessToken: 'new-token',
      tokenType: 'Bearer',
      expiresAt: '2030-01-01T00:00:00Z',
      user: { id: '1', email: 'ivan@example.com', displayName: 'Иван Петров', roles: ['ATHLETE', 'TRAINER'], activeRole: 'TRAINER' },
    })
    const user = userEvent.setup()
    renderProfile()

    expect(await screen.findByRole('link', { name: 'История' })).toBeInTheDocument()
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByText('Тренер'))

    expect(await screen.findByRole('link', { name: 'Атлеты' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'История' })).not.toBeInTheDocument()
    expect(switchActiveRole).toHaveBeenCalledWith('TRAINER')
    expect(localStorage.getItem('accessToken')).toBe('new-token')
  })

  it('при ошибке оставляет прежнюю роль и показывает сообщение', async () => {
    seedSession(['ATHLETE', 'TRAINER'], 'ATHLETE')
    vi.mocked(switchActiveRole).mockRejectedValue(new Error('network'))
    const user = userEvent.setup()
    renderProfile()

    await user.click(await screen.findByRole('combobox'))
    await user.click(await screen.findByText('Тренер'))

    expect(await screen.findByText('Не удалось сменить роль. Попробуйте ещё раз')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'История' })).toBeInTheDocument()
    expect(localStorage.getItem('accessToken')).toBe('old-token')
  })

  it('не показывает переключатель администратору и пользователю с одной ролью', async () => {
    seedSession(['ADMIN'], 'ADMIN')
    renderProfile()

    expect(await screen.findByText('Администратор')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('игнорирует ответ на смену роли, пришедший после выхода', async () => {
    seedSession(['ATHLETE', 'TRAINER'], 'ATHLETE')
    let resolveSwitch: (response: AuthResponse) => void = () => {}
    vi.mocked(switchActiveRole).mockReturnValue(new Promise((resolve) => { resolveSwitch = resolve }))
    const user = userEvent.setup()
    renderProfile()

    await user.click(await screen.findByRole('combobox'))
    await user.click(await screen.findByText('Тренер'))
    await user.click(screen.getByRole('button', { name: 'Выйти' }))
    expect(await screen.findByRole('heading', { name: 'Войти' })).toBeInTheDocument()

    await act(async () => { resolveSwitch(trainerResponse) })

    expect(screen.getByRole('heading', { name: 'Войти' })).toBeInTheDocument()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('cb-session')).toBeNull()
  })
})
