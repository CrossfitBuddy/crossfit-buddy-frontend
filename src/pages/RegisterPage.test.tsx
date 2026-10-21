import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerUser } from '../api/auth'
import { RegisterPage } from './RegisterPage'

vi.mock('../api/auth', () => ({ registerUser: vi.fn() }))

const registerUserMock = vi.mocked(registerUser)

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, overrides: { confirmPassword?: string } = {}) {
  await user.type(screen.getByLabelText('Имя'), 'Иван')
  await user.type(screen.getByLabelText('Фамилия'), 'Петров')
  await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
  await user.type(screen.getByLabelText('Пароль'), '12345678')
  await user.type(screen.getByLabelText('Подтверждение пароля'), overrides.confirmPassword ?? '12345678')
  await user.click(screen.getByLabelText('Роль'))
  await user.click(await screen.findByTitle('Атлет'))
}

function conflictError() {
  const headers = new AxiosHeaders()
  return new AxiosError('Conflict', 'ERR_BAD_REQUEST', { headers }, null, {
    status: 409,
    statusText: 'Conflict',
    data: {},
    headers: {},
    config: { headers },
  })
}

describe('RegisterPage', () => {
  beforeEach(() => {
    registerUserMock.mockReset()
  })

  it('отправляет данные и просит проверить почту', async () => {
    registerUserMock.mockResolvedValue()
    const user = userEvent.setup()
    renderPage()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(await screen.findByText('Проверьте почту')).toBeInTheDocument()
    expect(registerUserMock.mock.calls[0][0]).toEqual({
      email: 'ivan@example.com',
      password: '12345678',
      displayName: 'Иван Петров',
      role: 'ATHLETE',
    })
  })

  it('показывает ошибку, если email уже занят', async () => {
    registerUserMock.mockRejectedValue(conflictError())
    const user = userEvent.setup()
    renderPage()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(await screen.findByText('Пользователь с таким email уже зарегистрирован')).toBeInTheDocument()
  })

  it('не отправляет форму повторно, пока идёт запрос', async () => {
    registerUserMock.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    renderPage()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))
    await user.type(screen.getByLabelText('Фамилия'), 'а')
    await user.click(screen.getByRole('button', { name: /Зарегистрироваться/ }))
    await user.type(screen.getByLabelText('Фамилия'), '{Enter}')

    await waitFor(() => expect(registerUserMock).toHaveBeenCalledTimes(1))
  })

  it('не отправляет пустую форму', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(await screen.findByText('Введите имя')).toBeInTheDocument()
    expect(screen.getByText('Введите email')).toBeInTheDocument()
    expect(registerUserMock).not.toHaveBeenCalled()
  })

  it('не отправляет форму, если пароли не совпадают', async () => {
    const user = userEvent.setup()
    renderPage()

    await fillForm(user, { confirmPassword: '87654321' })
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(await screen.findByText('Введённые пароли не совпадают')).toBeInTheDocument()
    await waitFor(() => expect(registerUserMock).not.toHaveBeenCalled())
  })
})
