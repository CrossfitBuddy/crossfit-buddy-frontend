import { fireEvent, render as renderView, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { downloadMedia } from './mediaApi'
import { CatalogVideo } from './CatalogVideo'
import { Illustration } from './Illustration'

vi.mock('./mediaApi', () => ({ downloadMedia: vi.fn() }))
beforeEach(() => vi.resetAllMocks())
function render(element: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
  return renderView(element, { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> })
}

it('показывает изображение из данных упражнения и иллюстрацию при ошибке загрузки', () => {
  const exercise = { id: 'id', name: 'Приседания', category: 'Силовые', equipment: '', description: '', imageUrl: 'https://storage.test/image.png' }
  render(<Illustration exercise={exercise} />)
  const image = screen.getByAltText('Иллюстрация: Приседания')
  expect(image).toHaveAttribute('src', exercise.imageUrl)
  fireEvent.error(image)
  expect(screen.queryByAltText('Иллюстрация: Приседания')).not.toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Иллюстрация: Приседания' })).toBeInTheDocument()
})

it('получает подписанную ссылку для изображения по fileId', async () => {
  vi.mocked(downloadMedia).mockResolvedValue({ downloadUrl: 'https://storage.test/signed.png', expiresAt: new Date(Date.now() + 600000).toISOString() })
  render(<Illustration exercise={{ id: 'exercise', name: 'Берпи', category: 'Кардио', description: '', equipment: '', imageFileId: 'image-id' }} />)
  expect(await screen.findByAltText('Иллюстрация: Берпи')).toHaveAttribute('src', 'https://storage.test/signed.png')
  expect(downloadMedia).toHaveBeenCalledWith('image-id', expect.any(AbortSignal))
})

it('повторяет запрос ссылки для видео после ошибки', async () => {
  vi.mocked(downloadMedia).mockRejectedValueOnce(new Error('503')).mockResolvedValue({ downloadUrl: 'https://storage.test/signed.mp4', expiresAt: new Date(Date.now() + 600000).toISOString() })
  render(<CatalogVideo fileId="video-id" />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить видео')
  fireEvent.click(screen.getByRole('button', { name: 'Повторить загрузку видео' }))
  await waitFor(() => expect(screen.getByLabelText('Видеопример упражнения')).toHaveAttribute('src', 'https://storage.test/signed.mp4'))
})

it('обновляет истекающую ссылку без повторного открытия видео', async () => {
  vi.mocked(downloadMedia)
    .mockResolvedValueOnce({ downloadUrl: 'https://storage.test/old.mp4', expiresAt: new Date(Date.now() + 5500).toISOString() })
    .mockResolvedValue({ downloadUrl: 'https://storage.test/new.mp4', expiresAt: new Date(Date.now() + 600000).toISOString() })
  render(<CatalogVideo fileId="video-id" />)
  expect(await screen.findByLabelText('Видеопример упражнения')).toHaveAttribute('src', 'https://storage.test/old.mp4')
  await waitFor(() => expect(screen.getByLabelText('Видеопример упражнения')).toHaveAttribute('src', 'https://storage.test/new.mp4'), { timeout: 2500 })
})

it('показывает видео, ошибку загрузки и новый источник после замены URL', () => {
  const view = render(<CatalogVideo url="https://storage.test/video.mp4" />)
  const video = screen.getByLabelText('Видеопример упражнения')
  expect(video).toHaveAttribute('src', 'https://storage.test/video.mp4')
  expect(video).toHaveAttribute('controls')
  fireEvent.error(video)
  expect(screen.getByRole('status')).toHaveTextContent('Видеопример недоступен')
  view.rerender(<CatalogVideo url="https://storage.test/new.mp4" />)
  expect(screen.getByLabelText('Видеопример упражнения')).toHaveAttribute('src', 'https://storage.test/new.mp4')
})

it('не использует ключ MinIO как относительный адрес страницы фронтенда', () => {
  render(<CatalogVideo url="exercises/videos/object.mp4" />)
  expect(screen.queryByLabelText('Видеопример упражнения')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Видеопример недоступен')
})
