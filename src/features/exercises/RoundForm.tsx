import { Button, InputNumber, Modal } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exercises, type ExerciseParameter } from './catalog'
import { Illustration } from './Illustration'
import { removeRoundExercise, resetSelection, updateRoundParameter, useSelection, type RoundExercise } from './selection'

type RoundFormProps = {
  onConfirm?: (round: RoundExercise[]) => void
}

function hasInvalidValue(item: RoundExercise, parameter: ExerciseParameter) {
  const value = item.parameters[parameter.id]
  return value !== undefined && parameter.valueType === 'INTEGER' && !Number.isInteger(value)
}

export function RoundForm({ onConfirm }: RoundFormProps) {
  const navigate = useNavigate()
  const { round } = useSelection()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const items = round.flatMap((item) => {
    const exercise = exercises.find((entry) => entry.id === item.exerciseId)
    return exercise ? [{ ...item, exercise }] : []
  })
  const editing = items.find((item) => item.key === editingKey)
  const hasInvalidParameters = items.some((item) => item.exercise.parameters.some((parameter) => hasInvalidValue(item, parameter)))
  const closeSettings = () => setEditingKey(null)

  const confirmRound = () => {
    if (!onConfirm || !items.length || hasInvalidParameters) return
    onConfirm(round)
    resetSelection()
  }

  return (
    <div className="bg-[#f7f7f5] text-[#171c18]">
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
        <h1 className="mt-3 text-4xl font-black">Раунд</h1>
      </header>
      <div className="space-y-4 p-6">
        {items.length === 0 ? <p className="text-stone-500">Упражнений пока нет</p> : (
          <ol className="space-y-3" aria-label="Упражнения раунда">
            {items.map((item, index) => (
              <li key={item.key} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                <Illustration exercise={item.exercise} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{index + 1}. {item.exercise.name}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm font-bold">
                    <button
                      type="button"
                      className="text-lime-800"
                      aria-label={`Настроить ${index + 1} ${item.exercise.name}`}
                      onClick={() => setEditingKey(item.key)}
                    >
                      Настроить
                    </button>
                    <button
                      type="button"
                      className="text-red-700"
                      aria-label={`Удалить ${index + 1} ${item.exercise.name}`}
                      onClick={() => removeRoundExercise(item.key)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
        <Button block size="large" onClick={() => navigate('/exercises')}>Добавить упражнения</Button>
        {hasInvalidParameters && <p role="alert" className="text-sm text-red-700">Проверьте значения в настройках упражнений.</p>}
        <Button type="primary" block size="large" disabled={!items.length || !onConfirm || hasInvalidParameters} onClick={confirmRound}>
          Готово
        </Button>
      </div>
      {editing && (
        <Modal
          open
          title={editing.exercise.name}
          onCancel={closeSettings}
          footer={<Button type="primary" onClick={closeSettings}>Закрыть</Button>}
        >
          <div className="space-y-4">
            {editing.exercise.parameters.length === 0 && <p>Для этого упражнения нет параметров.</p>}
            {editing.exercise.parameters.map((parameter) => {
              const invalid = hasInvalidValue(editing, parameter)
              const fieldId = `round-${editing.key}-${parameter.id}`
              return (
                <div key={parameter.id} className="space-y-1">
                  <label className="block font-semibold" htmlFor={fieldId}>
                    {parameter.name}{parameter.unit ? `, ${parameter.unit}` : ''}
                  </label>
                  <InputNumber
                    id={fieldId}
                    className="!w-full"
                    value={editing.parameters[parameter.id] ?? null}
                    controls={false}
                    decimalSeparator=","
                    step={parameter.valueType === 'INTEGER' ? 1 : 0.1}
                    status={invalid ? 'error' : undefined}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? `${fieldId}-error` : undefined}
                    onChange={(value) => updateRoundParameter(editing.key, parameter.id, value)}
                  />
                  {invalid && <p id={`${fieldId}-error`} className="text-sm text-red-700">Введите целое число.</p>}
                </div>
              )
            })}
          </div>
        </Modal>
      )}
    </div>
  )
}
