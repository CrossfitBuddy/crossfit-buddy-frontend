import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { ExerciseCatalog } from './ExerciseCatalog'

function renderCatalog() {
  render(<ExerciseCatalog />)
}

it('показывает поиск, фильтры, алфавитный список и кнопку готово', () => {
  renderCatalog()
  expect(screen.getByLabelText('Поиск')).toBeInTheDocument()
  expect(screen.getByLabelText('Категория')).toBeInTheDocument()
  expect(screen.getByLabelText('Оборудование')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Б' })).toBeInTheDocument()
  expect(screen.getByText('Берпи')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Готово' })).toBeInTheDocument()
})

it('фильтрует по тексту, категории и оборудованию вместе', async () => {
  const user = userEvent.setup()
  renderCatalog()
  await user.type(screen.getByLabelText('Поиск'), 'ска')
  await user.selectOptions(screen.getByLabelText('Категория'), 'Кардио')
  await user.selectOptions(screen.getByLabelText('Оборудование'), 'Скакалка')
  expect(screen.getByRole('button', { name: 'Подробнее Скакалка' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Подробнее Берпи' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Подробнее Гребля' })).not.toBeInTheDocument()
})

it('после закрытия подробностей сохраняет поиск, фильтры и выбор', async () => {
  const user = userEvent.setup()
  renderCatalog()
  await user.click(screen.getByRole('button', { name: 'Выбрать Берпи' }))
  await user.type(screen.getByLabelText('Поиск'), 'бер')
  await user.selectOptions(screen.getByLabelText('Категория'), 'Кардио')
  await user.click(screen.getByRole('button', { name: 'Подробнее Берпи' }))
  expect(screen.getByRole('region', { name: 'Подробности упражнения' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Берпи' })).toBeInTheDocument()
  expect(screen.getByText('Видеопример не добавлен')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Закрыть' }))
  expect(screen.getByLabelText('Поиск')).toHaveValue('бер')
  expect(screen.getByLabelText('Категория')).toHaveValue('Кардио')
  expect(screen.getByText('Выбрано: 1')).toBeInTheDocument()
  await user.clear(screen.getByLabelText('Поиск'))
  await user.selectOptions(screen.getByLabelText('Категория'), 'all')
  expect(screen.getByRole('button', { name: 'Выбрано Берпи' })).toBeInTheDocument()
})
