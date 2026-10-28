import { useState } from 'react'
import { exerciseCategories, exerciseEquipment, exercises, filterExercises, groupByLetter } from './catalog'
import type { Exercise } from './catalog'

const tones: Record<string, string> = {
  Грудь: '#65a30d',
  Икры: '#4d7c0f',
  Кардио: '#84cc16',
  Ноги: '#3f6212',
  Плечи: '#a3e635',
  Пресс: '#166534',
  Руки: '#14532d',
  Спина: '#365314',
}

function Illustration({ exercise, large = false }: { exercise: Exercise; large?: boolean }) {
  const size = large ? 160 : 56
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={`Иллюстрация: ${exercise.name}`} className="shrink-0 rounded-2xl">
      <rect width="80" height="80" rx="16" fill={tones[exercise.category] ?? '#65a30d'} />
      <rect x="18" y="34" width="44" height="12" rx="4" fill="#17200f" />
      <rect x="12" y="28" width="8" height="24" rx="3" fill="#f7f7f5" />
      <rect x="60" y="28" width="8" height="24" rx="3" fill="#f7f7f5" />
    </svg>
  )
}

export function ExerciseCatalog() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [equipment, setEquipment] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [openedId, setOpenedId] = useState<string | null>(null)
  const visible = filterExercises(exercises, query, category, equipment)
  const groups = groupByLetter(visible)
  const opened = exercises.find((exercise) => exercise.id === openedId) ?? null

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  return (
    <div className="bg-[#f7f7f5] text-[#171c18]">
      <header className="bg-[#101914] px-6 pb-6 pt-12 text-white">
        <p className="text-sm font-bold text-lime-400">CrossfitBuddy</p>
        <h1 className="mt-3 text-4xl font-black">Упражнения</h1>
        <label className="mt-6 block text-sm text-stone-300">
          Поиск
          <input
            aria-label="Поиск"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl bg-white px-3 text-base text-[#171c18]"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm text-stone-300">
            Категория
            <select aria-label="Категория" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 h-11 w-full rounded-xl bg-white px-2 text-base text-[#171c18]">
              <option value="all">Все</option>
              {exerciseCategories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm text-stone-300">
            Оборудование
            <select aria-label="Оборудование" value={equipment} onChange={(event) => setEquipment(event.target.value)} className="mt-2 h-11 w-full rounded-xl bg-white px-2 text-base text-[#171c18]">
              <option value="all">Все</option>
              {exerciseEquipment.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </header>

      {opened ? (
        <section className="px-6 py-6" aria-label="Подробности упражнения">
          <button type="button" className="text-sm font-bold text-lime-700" onClick={() => setOpenedId(null)}>Закрыть</button>
          <div className="mt-4 flex justify-center"><Illustration exercise={opened} large /></div>
          <h2 className="mt-4 text-3xl font-black">{opened.name}</h2>
          <p className="mt-2 text-stone-500">{opened.category} · {opened.equipment}</p>
          <p className="mt-4 whitespace-pre-wrap text-base">{opened.description}</p>
          <h3 className="mt-6 text-lg font-bold">Видеопример</h3>
          <p className="mt-2 text-stone-500">Видеопример не добавлен</p>
        </section>
      ) : (
        <div className="px-6 py-6">
          {groups.length === 0 ? <p className="text-stone-500">Ничего не найдено</p> : groups.map((group) => (
            <section key={group.letter} className="mb-6" aria-label={group.letter}>
              <h2 className="mb-3 text-sm font-bold text-stone-400">{group.letter}</h2>
              <ul className="space-y-3">
                {group.items.map((exercise) => {
                  const chosen = selected.includes(exercise.id)
                  return (
                    <li key={exercise.id} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                      <Illustration exercise={exercise} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{exercise.name}</p>
                        <p className="text-sm text-stone-500">{exercise.category}</p>
                        <div className="mt-2 flex gap-3 text-sm font-bold">
                          <button type="button" className="text-lime-700" aria-label={`Подробнее ${exercise.name}`} onClick={() => setOpenedId(exercise.id)}>Подробнее</button>
                          <button type="button" aria-pressed={chosen} aria-label={chosen ? `Выбрано ${exercise.name}` : `Выбрать ${exercise.name}`} className={chosen ? 'text-[#171c18]' : 'text-stone-500'} onClick={() => toggle(exercise.id)}>
                            {chosen ? 'Выбрано' : 'Выбрать'}
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          <p className="mb-3 text-sm text-stone-500">Выбрано: {selected.length}</p>
          <button type="button" className="h-11 w-full rounded-xl bg-[#65a30d] text-base font-bold text-[#17200f]">Готово</button>
        </div>
      )}
    </div>
  )
}
