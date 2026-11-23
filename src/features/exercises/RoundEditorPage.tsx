import { Button } from 'antd'
import { useState } from 'react'
import { exercises } from './catalog'
import { RoundForm } from './RoundForm'
import type { RoundExercise } from './selection'

export function RoundEditorPage() {
  const [round, setRound] = useState<RoundExercise[] | null>(null)

  if (!round) return <RoundForm onConfirm={setRound} />

  return (
    <div className="bg-[#f7f7f5] text-[#171c18]">
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
        <h1 className="mt-3 text-4xl font-black">Черновик тренировки</h1>
      </header>
      <section className="space-y-4 p-6" aria-labelledby="confirmed-round-title">
        <h2 id="confirmed-round-title" className="text-xl font-bold">Сформированный раунд</h2>
        <ol className="space-y-3" aria-label="Подтверждённые упражнения">
          {round.map((item, index) => {
            const exercise = exercises.find((entry) => entry.id === item.exerciseId)
            if (!exercise) return null
            return (
              <li key={item.key} className="rounded-2xl bg-white p-4">
                <p className="font-bold">{index + 1}. {exercise.name}</p>
                {exercise.parameters.map((parameter) => {
                  const value = item.parameters[parameter.id]
                  if (value === undefined) return null
                  return <p key={parameter.id} className="text-sm text-stone-600">{parameter.name}: {value} {parameter.unit}</p>
                })}
              </li>
            )
          })}
        </ol>
        <Button block size="large" onClick={() => setRound(null)}>Сформировать новый раунд</Button>
      </section>
    </div>
  )
}
