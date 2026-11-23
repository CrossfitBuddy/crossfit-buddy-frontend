import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { CatalogVideo } from './CatalogVideo'
import { Illustration } from './Illustration'

it('показывает изображение из данных упражнения и иллюстрацию при ошибке загрузки', () => {
  const exercise = { id: 'id', name: 'Приседания', category: 'Силовые', equipment: '', description: '', imageUrl: 'https://storage.test/image.png' }
  render(<Illustration exercise={exercise} />)
  const image = screen.getByAltText('Иллюстрация: Приседания')
  expect(image).toHaveAttribute('src', exercise.imageUrl)
  fireEvent.error(image)
  expect(screen.queryByAltText('Иллюстрация: Приседания')).not.toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Иллюстрация: Приседания' })).toBeInTheDocument()
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
