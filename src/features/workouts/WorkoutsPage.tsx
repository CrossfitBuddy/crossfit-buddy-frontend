import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../app/auth/useAuth'
import { sources, statuses, workoutsApi, type Workout } from './workoutsApi'

const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })
const sourceColors = {
  own: 'bg-lime-100 text-lime-900',
  assigned: 'bg-blue-100 text-blue-900',
  shared: 'bg-violet-100 text-violet-900',
}

function WorkoutInfo({ workout }: { workout: Workout }) {
  return (
    <>
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className={`rounded-full px-3 py-1 ${sourceColors[workout.source]}`}>{sources[workout.source]}</span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{statuses[workout.status]}</span>
      </div>
      <h2 className="mt-3 text-lg font-bold">{workout.title}</h2>
      <p>{workout.format}</p>
      <time className="text-sm text-stone-600" dateTime={workout.startsAt}>{dateFormat.format(new Date(workout.startsAt))}</time>
    </>
  )
}

const control = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm'

function Filter({ label, value, options, onChange }: {
  label: string
  value: string
  options: [string, string][]
  onChange: (value: string) => void
}) {
  return (
    <label className="grid min-w-0 gap-1 text-sm font-semibold">
      {label}
      <select className={control} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Все</option>
        {options.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
      </select>
    </label>
  )
}

function LoadError({ retry }: { retry: () => void }) {
  return <div role="alert">Не удалось загрузить данные. <button className="font-bold underline" onClick={retry}>Повторить</button></div>
}

export function WorkoutsPage() {
  const { user, activeRole } = useAuth()
  const { workoutId } = useParams()
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('')
  const [status, setStatus] = useState('')
  const [format, setFormat] = useState('')
  const [date, setDate] = useState('')
  const list = useQuery({
    queryKey: ['workouts', user?.id, activeRole],
    queryFn: () => workoutsApi.list(activeRole!),
    enabled: Boolean(user && activeRole && !workoutId),
    retry: false,
  })
  const detail = useQuery({
    queryKey: ['workout', user?.id, activeRole, workoutId],
    queryFn: () => workoutsApi.get(workoutId!, activeRole!),
    enabled: Boolean(user && activeRole && workoutId),
    retry: false,
    gcTime: 0,
  })
  const workouts = list.data ?? []
  const formats = [...new Set(workouts.map((workout) => workout.format))]
  const term = search.trim().toLocaleLowerCase('ru')
  const visible = workouts.filter((workout) =>
    workout.title.toLocaleLowerCase('ru').includes(term)
    && (!source || workout.source === source)
    && (!status || workout.status === status)
    && (!format || workout.format === format)
    && (!date || workout.startsAt.slice(0, 10) === date),
  )

  return (
    <div className="min-h-full bg-[#f7f7f5] text-[#171c18]">
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
        <h1 className="mt-3 text-4xl font-black">{workoutId ? 'Тренировка' : 'Тренировки'}</h1>
      </header>
      <div className="space-y-4 p-6">
        {workoutId ? (
          <>
            <Link className="font-bold text-lime-800" to="/workouts">К тренировкам</Link>
            {detail.isFetching ? <p role="status">Загрузка тренировки…</p>
              : detail.isError ? <LoadError retry={() => void detail.refetch()} />
              : detail.data ? <article className="rounded-2xl bg-white p-4"><WorkoutInfo workout={detail.data} /></article>
              : <p role="alert">Нет доступа к этой тренировке.</p>}
          </>
        ) : (
          <>
            <label className="grid gap-1 text-sm font-semibold">
              Поиск по названию
              <input type="search" className={control} value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Filter label="Источник" value={source} options={Object.entries(sources)} onChange={setSource} />
              <Filter label="Статус" value={status} options={Object.entries(statuses)} onChange={setStatus} />
              <Filter label="Формат" value={format} options={formats.map((item) => [item, item])} onChange={setFormat} />
              <label className="grid min-w-0 gap-1 text-sm font-semibold">
                Дата
                <input type="date" className={control} value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
            </div>
            {list.isPending ? <p role="status">Загрузка тренировок…</p>
              : list.isError ? <LoadError retry={() => void list.refetch()} />
              : !workouts.length ? <p>Доступные тренировки отсутствуют</p>
              : !visible.length ? <p>По заданным условиям ничего не найдено</p>
              : <ul className="space-y-3">{visible.map((workout) => (
                <li key={workout.id}>
                  <Link to={`/workouts/${encodeURIComponent(workout.id)}`} className="block rounded-2xl bg-white p-4 shadow-sm">
                    <WorkoutInfo workout={workout} />
                  </Link>
                </li>
              ))}</ul>}
          </>
        )}
      </div>
    </div>
  )
}