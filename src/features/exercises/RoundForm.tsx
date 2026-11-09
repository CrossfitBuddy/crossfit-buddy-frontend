import { Button, Modal } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exercises } from './catalog'
import { Illustration } from './Illustration'
import { removeRoundExercise, useSelection, type SelectedExercise } from './selection'

type RoundFormProps = {
  onConfirm?: (round: SelectedExercise[]) => void
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
        <Button type="primary" block size="large" disabled={!items.length || !onConfirm} onClick={() => onConfirm?.(round)}>
          Готово
        </Button>
      </div>
      {editing && (
        <Modal open title={editing.exercise.name} footer={null} onCancel={() => setEditingKey(null)}>
          <p>Параметры не заданы.</p>
        </Modal>
      )}
    </div>
  )
}
