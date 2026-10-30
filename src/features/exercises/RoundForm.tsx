import { useNavigate } from 'react-router-dom'
import { exercises } from './catalog'
import { Illustration } from './Illustration'
import { useSelection } from './selection'

export function RoundForm() {
  const navigate = useNavigate()
  const { round } = useSelection()
  const items = round.flatMap((item) => {
    const exercise = exercises.find((entry) => entry.id === item.exerciseId)
    return exercise ? [{ ...item, exercise }] : []
  })

  return (
    <div className="bg-[#f7f7f5] text-[#171c18]">
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <p className="text-sm font-bold text-lime-400">CrossfitBuddy</p>
        <h1 className="mt-3 text-4xl font-black">Раунд</h1>
      </header>
      <div className="px-6 py-6">
        {items.length === 0 ? <p className="text-stone-500">Упражнений пока нет</p> : (
          <ol className="space-y-3" aria-label="Упражнения раунда">
            {items.map((item, index) => (
              <li key={item.key} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                <Illustration exercise={item.exercise} />
                <p className="font-bold">{index + 1}. {item.exercise.name}</p>
              </li>
            ))}
          </ol>
        )}
        <button type="button" className="mt-6 h-11 w-full rounded-xl bg-[#65a30d] text-base font-bold text-[#17200f]" onClick={() => navigate('/exercises')}>
          Добавить упражнения
        </button>
      </div>
    </div>
  )
}
