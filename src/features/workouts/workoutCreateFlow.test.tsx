import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ExerciseCatalog } from '../exercises/ExerciseCatalog'
import { RoundRoute } from '../exercises/RoundRoute'
import { resetSelection } from '../exercises/selection'
import { WorkoutCreatePage } from '../../pages/WorkoutCreatePage'
import { findCatalogItem, defaultParamsForCatalogItem } from './workoutFormatCatalog'
import { getWorkoutDraft, patchWorkoutDraft, patchWorkoutStage, resetWorkoutDraft } from './workoutDraft'

beforeEach(() => {
  resetWorkoutDraft()
  resetSelection()
})

function renderCreateFlow(path = '/workouts/new') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/workouts/new" element={<WorkoutCreatePage />} />
        <Route path="/exercises" element={<ExerciseCatalog />} />
        <Route path="/round" element={<RoundRoute />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function selectFormat(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: label }))
  const items = await screen.findAllByTitle(option)
  await user.click(items[items.length - 1])
}

it('сквозной: WOD AMRAP → раунд → возврат → Сохранить активна', async () => {
  const user = userEvent.setup()
  renderCreateFlow()

  await user.type(screen.getByLabelText('Название'), 'Тест плана')
  await selectFormat(user, 'Формат: WOD', 'AMRAP')

  const wod = screen.getByRole('region', { name: /WOD/i })
  await user.click(within(wod).getByRole('button', { name: 'Собрать раунд' }))

  await user.click(screen.getByRole('button', { name: 'Выбрать Берпи' }))
  await user.click(screen.getByRole('button', { name: 'Готово' }))

  expect(screen.getByRole('heading', { name: 'Раунд' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Готово' }))

  expect(screen.getByRole('heading', { name: 'Новая тренировка' })).toBeInTheDocument()
  expect(screen.getByDisplayValue('Тест плана')).toBeInTheDocument()
  expect(within(screen.getByRole('region', { name: /WOD/i })).getByText('Берпи')).toBeInTheDocument()

  const save = screen.getByRole('button', { name: 'Сохранить' })
  expect(save).toBeEnabled()
  await user.click(save)
  expect(await screen.findByText(/готовы к отправке/i)).toBeInTheDocument()
})

it('возврат из раунда не сбрасывает другой этап', async () => {
  const user = userEvent.setup()
  const amrap = findCatalogItem('AMRAP')!
  patchWorkoutDraft({ datetime: new Date().toISOString(), name: 'Сохранить разминку' })
  patchWorkoutStage(0, {
    format: 'AMRAP',
    params: defaultParamsForCatalogItem(amrap),
    round: [{ key: 'w', exerciseId: 'plank', parameters: {} }],
  })

  renderCreateFlow()

  expect(screen.getByText('Планка')).toBeInTheDocument()

  await selectFormat(user, 'Формат: WOD', 'AMRAP')
  await user.click(within(screen.getByRole('region', { name: /WOD/i })).getByRole('button', { name: 'Собрать раунд' }))
  await user.click(screen.getByRole('button', { name: 'Выбрать Берпи' }))
  await user.click(screen.getByRole('button', { name: 'Готово' }))
  await user.click(screen.getByRole('button', { name: 'Готово' }))

  expect(within(screen.getByRole('region', { name: 'Разминка' })).getByText('Планка')).toBeInTheDocument()
  expect(getWorkoutDraft().stages[0].round[0].exerciseId).toBe('plank')
})