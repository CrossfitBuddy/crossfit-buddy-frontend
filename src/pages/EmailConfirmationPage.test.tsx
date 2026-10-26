import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { confirmEmail, resendConfirmationEmail } from '../api/auth'
import { EmailConfirmationPage } from './EmailConfirmationPage'

vi.mock('../api/auth', () => ({ confirmEmail: vi.fn(), resendConfirmationEmail: vi.fn() }))

const confirmEmailMock = vi.mocked(confirmEmail)
const resendMock = vi.mocked(resendConfirmationEmail)

function renderPage(url: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <EmailConfirmationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function apiError(status: number) {
  const headers = new AxiosHeaders()
  return new AxiosError('Error', 'ERR_BAD_REQUEST', { headers }, null, {
    status,
    statusText: 'Error',
    data: {},
    headers: {},
    config: { headers },
  })
}

describe('EmailConfirmationPage', () => {
  beforeEach(() => {
    confirmEmailMock.mockReset()
    resendMock.mockReset()
  })

  it('подтверждает email по токену из ссылки', async () => {
    confirmEmailMock.mockResolvedValue()
    renderPage('/auth/email-confirmation?token=abc')

    expect(await screen.findByText('Email подтверждён')).toBeInTheDocument()
    expect(confirmEmailMock).toHaveBeenCalledWith('abc')
    expect(screen.getByRole('button', { name: 'Перейти ко входу' })).toBeInTheDocument()
  })

  it('при истёкшей ссылке отправляет письмо повторно', async () => {
    confirmEmailMock.mockRejectedValue(apiError(410))
    resendMock.mockResolvedValue()
    const user = userEvent.setup()
    renderPage('/auth/email-confirmation?token=old')

    expect(await screen.findByText('Ссылка больше не действует')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
    await user.click(screen.getByRole('button', { name: 'Отправить письмо ещё раз' }))

    expect(await screen.findByText('Письмо отправлено, проверьте почту')).toBeInTheDocument()
    expect(resendMock.mock.calls[0][0]).toBe('ivan@example.com')
  })

  it('показывает ошибку при недействительной ссылке', async () => {
    confirmEmailMock.mockRejectedValue(apiError(400))
    renderPage('/auth/email-confirmation?token=bad')

    expect(await screen.findByText('Не удалось подтвердить email')).toBeInTheDocument()
  })

  it.each([
    ['нет связи с сервером', new AxiosError('Network Error', 'ERR_NETWORK')],
    ['сервер ответил 503', apiError(503)],
  ])('позволяет повторить запрос, если %s', async (_, error) => {
    confirmEmailMock.mockRejectedValueOnce(error)
    confirmEmailMock.mockResolvedValueOnce()
    const user = userEvent.setup()
    renderPage('/auth/email-confirmation?token=abc')

    expect(await screen.findByText('Сервер временно недоступен')).toBeInTheDocument()
    expect(screen.queryByText('Ссылка недействительна. Запросите новое письмо')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(await screen.findByText('Email подтверждён')).toBeInTheDocument()
  })

  it('без токена не отправляет запрос', async () => {
    renderPage('/auth/email-confirmation')

    expect(await screen.findByText('Не удалось подтвердить email')).toBeInTheDocument()
    await waitFor(() => expect(confirmEmailMock).not.toHaveBeenCalled())
  })
})
