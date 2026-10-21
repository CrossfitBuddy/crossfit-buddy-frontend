import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../App'
import { AuthProvider } from '../../app/auth/AuthProvider'

afterEach(() => localStorage.clear())
it('использует общую роль, меняет меню вместе с профилем и сохраняет выход', async () => {
  localStorage.setItem('cb-session', JSON.stringify({ user: {
    email: 'review@example.com', firstName: 'Анна', lastName: 'Рябова', roles: ['ATHLETE', 'TRAINER'],
  }, activeRole: 'ATHLETE' }))
  const user = userEvent.setup()
  render(<QueryClientProvider client={new QueryClient()}><AuthProvider><MemoryRouter initialEntries={['/profile']}><App /></MemoryRouter></AuthProvider></QueryClientProvider>)
  expect(await screen.findByText('Анна Рябова')).toBeInTheDocument()
  await user.click(screen.getByRole('combobox', { name: 'Активная роль' }))
  await user.click(await screen.findByTitle('Тренер'))
  expect(await screen.findByText('Тренерское')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Атлеты' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'История' })).not.toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem('cb-session')!).activeRole).toBe('TRAINER')
  await user.click(screen.getByRole('button', { name: 'Выйти' }))
  expect(await screen.findByRole('button', { name: 'Войти' })).toBeInTheDocument()
  expect(localStorage.getItem('cb-session')).toBeNull()
})