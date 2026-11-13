import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ExerciseCatalog } from './ExerciseCatalog'
import { RoundForm } from './RoundForm'
import { resetSelection } from './selection'

beforeEach(() => resetSelection())

function renderAt(path = '/exercises') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/exercises" element={<ExerciseCatalog />} />
        <Route path="/round" element={<RoundForm />} />
      </Routes>
    </MemoryRouter>,
  )
}

it('показывает поиск, фильтры, алфавитный список и кнопку готово', () => {
  renderAt()
  expect(screen.getByLabelText('Поиск')).toBeInTheDocument()
  expect(screen.getByLabelText('Категория')).toBeInTheDocument()
  expect(screen.getByLabelText('Оборудование')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Б' })).toBeInTheDocument()
  expect(screen.getByText('Берпи')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Готово' })).toBeInTheDocument()
})

it('фильтрует по тексту, категории и оборудованию вместе', async () => {
  const user = userEvent.setup()
  renderAt()
  await user.type(screen.getByLabelText('Поиск'), 'ска')
  await user.selectOptions(screen.getByLabelText('Категория'), 'Кардио')
  await user.selectOptions(screen.getByLabelText('Оборудование'), 'Скакалка')
  expect(screen.getByRole('button', { name: 'Подробнее Скакалка' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Подробнее Берпи' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Подробнее Гребля' })).not.toBeInTheDocument()
})

it('после закрытия подробностей сохраняет поиск, фильтры и выбор', async () => {
  const user = userEvent.setup()
  renderAt()
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
  expect(screen.getByRole('button', { name: 'Снять Берпи' })).toBeInTheDocument()
})

it('добавляет упражнение повторно, меняет порядок и возвращает его в раунд', async () => {
  const user = userEvent.setup()
  renderAt()
  await user.click(screen.getByRole('button', { name: 'Выбрать Берпи' }))
  await user.click(screen.getByRole('button', { name: 'Выбрать Берпи' }))
  await user.click(screen.getByRole('button', { name: 'Выбрать Приседания' }))
  expect(screen.getByText('Выбрано: 3')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Снять Берпи' }))
  expect(screen.getByText('Выбрано: 2')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Выбрать Берпи' }))
  const beforeMove = within(screen.getByRole('list', { name: 'Выбранные упражнения' })).getAllByRole('listitem')
  expect(beforeMove.map((item) => item.textContent)).toEqual([
    expect.stringContaining('1. Берпи'),
    expect.stringContaining('2. Приседания'),
    expect.stringContaining('3. Берпи'),
  ])
  await user.click(screen.getByRole('button', { name: 'Выше 3 Берпи' }))

  const picked = within(screen.getByRole('list', { name: 'Выбранные упражнения' })).getAllByRole('listitem')
  expect(picked.map((item) => item.textContent)).toEqual([
    expect.stringContaining('1. Берпи'),
    expect.stringContaining('2. Берпи'),
    expect.stringContaining('3. Приседания'),
  ])

  await user.click(screen.getByRole('button', { name: 'Готово' }))
  const round = within(screen.getByRole('list', { name: 'Упражнения раунда' })).getAllByRole('listitem')
  expect(round.map((item) => item.textContent)).toEqual([
    expect.stringContaining('1. Берпи'),
    expect.stringContaining('2. Берпи'),
    expect.stringContaining('3. Приседания'),
  ])

  await user.click(screen.getByRole('button', { name: 'Добавить упражнения' }))
  await user.click(screen.getByRole('button', { name: 'Выбрать Скакалка' }))
  await user.click(screen.getByRole('button', { name: 'Готово' }))
  expect(within(screen.getByRole('list', { name: 'Упражнения раунда' })).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    expect.stringContaining('1. Берпи'),
    expect.stringContaining('2. Берпи'),
    expect.stringContaining('3. Приседания'),
    expect.stringContaining('4. Скакалка'),
  ])
})
