import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { groupByLetter } from './catalog'
import type { CatalogApi } from './catalogApi'
import { updateCatalogSearch, useCatalogSearch } from './catalogSearch'
import { mockCatalogApi } from './mockCatalogApi'
import { Illustration } from './Illustration'
import { addExercise, confirmSelection, movePending, removeLastPending, removePendingAt, useSelection } from './selection'

export function ExerciseCatalog({ api = mockCatalogApi }: { api?: CatalogApi }) {
  const navigate = useNavigate()
  const { pending } = useSelection()
  const { query, category, equipment } = useCatalogSearch()
  const [openedId, setOpenedId] = useState<string | null>(null)
  const search = { query: query.trim(), category, equipment }
  const filters = useQuery({
    queryKey: ['exercise-browser', 'filters'],
    queryFn: ({ signal }) => api.getFilters(signal),
    retry: false,
  })
  const catalog = useQuery({
    queryKey: ['exercise-browser', 'search', search],
    queryFn: ({ signal }) => api.search(search, signal),
    retry: false,
  })
  const details = useQuery({
    queryKey: ['exercise-browser', 'detail', openedId],
    queryFn: ({ signal }) => api.getExercise(openedId!, signal),
    enabled: openedId !== null,
    retry: false,
  })
  const visible = [...(catalog.data ?? [])].sort((left, right) => left.name.localeCompare(right.name, 'ru'))
  const groups = groupByLetter(visible)
  const opened = details.data
  const categories = Array.from(new Set([...(filters.data?.categories ?? []), ...(category !== 'all' ? [category] : [])]))
  const equipmentOptions = Array.from(new Set([...(filters.data?.equipment ?? []), ...(equipment !== 'all' ? [equipment] : [])]))
  const picked = pending.flatMap((item) => {
    const exercise = item.exercise ?? catalog.data?.find((entry) => entry.id === item.exerciseId)
    return exercise ? [{ ...item, exercise }] : []
  })

  return (
    <div className="bg-[#f7f7f5] text-[#171c18]">
      <header className="bg-[#101914] px-6 pb-6 pt-12 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
        <h1 className="mt-3 text-4xl font-black">Упражнения</h1>
        <label className="mt-6 block text-sm text-stone-300">
          Поиск
          <input
            aria-label="Поиск"
            value={query}
            onChange={(event) => updateCatalogSearch({ query: event.target.value })}
            className="mt-2 h-11 w-full rounded-xl bg-white px-3 text-base text-[#171c18]"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm text-stone-300">
            Категория
            <select aria-label="Категория" value={category} onChange={(event) => updateCatalogSearch({ category: event.target.value })} className="mt-2 h-11 w-full rounded-xl bg-white px-2 text-base text-[#171c18]">
              <option value="all">Все</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm text-stone-300">
            Оборудование
            <select aria-label="Оборудование" value={equipment} onChange={(event) => updateCatalogSearch({ equipment: event.target.value })} className="mt-2 h-11 w-full rounded-xl bg-white px-2 text-base text-[#171c18]">
              <option value="all">Все</option>
              {equipmentOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
        {filters.isPending && <p role="status" className="mt-3 text-sm">Загрузка фильтров…</p>}
        {filters.isError && <div role="alert" className="mt-3 text-sm">
          Не удалось загрузить фильтры.{' '}
          <button type="button" className="underline" onClick={() => void filters.refetch()}>Повторить загрузку фильтров</button>
        </div>}
      </header>

      {openedId !== null ? (
        <section className="px-6 py-6" aria-label="Подробности упражнения">
          <button type="button" className="text-sm font-bold text-lime-700" onClick={() => setOpenedId(null)}>Закрыть</button>
          {details.isPending && <p role="status" className="mt-4 text-stone-500">Загрузка упражнения…</p>}
          {details.isError && <div role="alert" className="mt-4">
            Не удалось загрузить упражнение.{' '}
            <button type="button" className="font-bold text-lime-700" onClick={() => void details.refetch()}>Повторить загрузку упражнения</button>
          </div>}
          {opened && (
            <>
              <div className="mt-4 flex justify-center"><Illustration exercise={opened} large /></div>
              <h2 className="mt-4 text-3xl font-black">{opened.name}</h2>
              <p className="mt-2 text-stone-500">{opened.category} · {opened.equipment}</p>
              <p className="mt-4 whitespace-pre-wrap text-base">{opened.description}</p>
              <h3 className="mt-6 text-lg font-bold">Видеопример</h3>
              <p className="mt-2 text-stone-500">Видеопример не добавлен</p>
            </>
          )}
        </section>
      ) : (
        <div className="px-6 py-6">
          {catalog.isPending ? <p role="status" className="text-stone-500">Загрузка упражнений…</p> : catalog.isError ? (
            <div role="alert" className="mb-4">
              Не удалось загрузить упражнения.{' '}
              <button type="button" className="font-bold text-lime-700" onClick={() => void catalog.refetch()}>Повторить загрузку списка</button>
            </div>
          ) : groups.length === 0 ? <p className="text-stone-500">Ничего не найдено</p> : groups.map((group) => (
            <section key={group.letter} className="mb-6" aria-label={group.letter}>
              <h2 className="mb-3 text-sm font-bold text-stone-400">{group.letter}</h2>
              <ul className="space-y-3">
                {group.items.map((exercise) => {
                  const count = pending.filter((item) => item.exerciseId === exercise.id).length
                  return (
                    <li key={exercise.id} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                      <Illustration exercise={exercise} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{exercise.name}</p>
                        <p className="text-sm text-stone-500">{exercise.category}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm font-bold">
                          <button type="button" className="text-lime-700" aria-label={`Подробнее ${exercise.name}`} onClick={() => setOpenedId(exercise.id)}>Подробнее</button>
                          <button type="button" className="text-lime-700" aria-label={`Выбрать ${exercise.name}`} onClick={() => addExercise(exercise)}>Выбрать</button>
                          {count > 0 && <button type="button" className="text-stone-500" aria-label={`Снять ${exercise.name}`} onClick={() => removeLastPending(exercise.id)}>Снять</button>}
                          {count > 0 && <span className="text-stone-500">{count}</span>}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          {picked.length > 0 && (
            <ol className="mb-4 space-y-2" aria-label="Выбранные упражнения">
              {picked.map((item, index) => (
                <li key={item.key} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2">
                  <p className="min-w-0 flex-1 font-bold">{index + 1}. {item.exercise.name}</p>
                  <button type="button" className="text-sm font-bold text-lime-700 disabled:text-stone-300" aria-label={`Выше ${index + 1} ${item.exercise.name}`} disabled={index === 0} onClick={() => movePending(index, -1)}>Выше</button>
                  <button type="button" className="text-sm font-bold text-lime-700 disabled:text-stone-300" aria-label={`Ниже ${index + 1} ${item.exercise.name}`} disabled={index === picked.length - 1} onClick={() => movePending(index, 1)}>Ниже</button>
                  <button type="button" className="text-sm font-bold text-stone-500" aria-label={`Убрать ${index + 1} ${item.exercise.name}`} onClick={() => removePendingAt(index)}>Убрать</button>
                </li>
              ))}
            </ol>
          )}
          <p className="mb-3 text-sm text-stone-500">Выбрано: {pending.length}</p>
          <button type="button" className="h-11 w-full rounded-xl bg-[#65a30d] text-base font-bold text-[#17200f]" onClick={() => { confirmSelection(); navigate('/round') }}>Готово</button>
        </div>
      )}
    </div>
  )
}
