import { useQuery } from '@tanstack/react-query'
import { Button } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { resetWorkoutDraft } from './workoutDraft'
import { getApiErrorStatus } from '../../api/session'
import { useAuth } from '../../app/auth/useAuth'
import { WorkoutCardScreen } from './card/WorkoutCardScreen'
import { sources, statuses, workoutsApi, type Workout, type WorkoutFilters } from './workoutsApi'

const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })
const sourceColors = {
  OWN: 'bg-lime-100 text-lime-900',
  ASSIGNED: 'bg-blue-100 text-blue-900',
  SHARED: 'bg-violet-100 text-violet-900',
}

function WorkoutInfo({ workout }: { workout: Workout }) {
  return (
    <>
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className={`rounded-full px-3 py-1 ${sourceColors[workout.source]}`}>{sources[workout.source]}</span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{statuses[workout.status]}</span>
      </div>
      <h2 className="mt-3 text-lg font-bold">{workout.title?.trim() || 'Тренировка без названия'}</h2>
      <p className="text-sm text-stone-600">
        Создана <time dateTime={workout.date}>{dateFormat.format(new Date(workout.date))} UTC</time>
      </p>
    </>
  )
}

const control = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm'

function Filter<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T | ''
  options: Record<T, string>
  onChange: (value: T | '') => void
}) {
  return (
    <label className="grid min-w-0 gap-1 text-sm font-semibold">
      {label}
      <select className={control} value={value} onChange={(event) => onChange(event.target.value as T | '')}>
        <option value="">Все</option>
        {Object.entries(options).map(([key, name]) => <option key={key} value={key}>{String(name)}</option>)}
      </select>
    </label>
  )
}

function WorkoutList() {
  const { user, activeRole, signOut } = useAuth()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<WorkoutFilters>({ q: '', source: '', status: '', date: '', page: 0 })
  const q = search.trim()

  useEffect(() => {
    if (q === filters.q) return
    const timeout = window.setTimeout(() => setFilters((current) => ({ ...current, q, page: 0 })), 250)
    return () => window.clearTimeout(timeout)
  }, [q, filters.q])

  const list = useQuery({
    queryKey: ['workouts', user?.id, activeRole, filters],
    queryFn: ({ signal }) => workoutsApi.list(filters, signal),
    enabled: Boolean(user && activeRole),
    retry: false,
    gcTime: 0,
  })
  const statusCode = getApiErrorStatus(list.error)

  useEffect(() => {
    if (statusCode === 401) signOut()
  }, [statusCode, signOut])

  const changeFilters = (values: Partial<WorkoutFilters>) => {
    setFilters((current) => ({ ...current, page: 0, ...values }))
  }
  const hasFilters = Boolean(filters.q || filters.source || filters.status || filters.date)

  return (
    <>
      <label className="grid gap-1 text-sm font-semibold">
        Поиск по названию
        <input type="search" className={control} value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Filter label="Источник" value={filters.source} options={sources} onChange={(source) => changeFilters({ source })} />
        <Filter label="Статус" value={filters.status} options={statuses} onChange={(status) => changeFilters({ status })} />
        <label className="col-span-2 grid min-w-0 gap-1 text-sm font-semibold">
          Дата создания (UTC)
          <input type="date" className={control} value={filters.date} onChange={(event) => changeFilters({ date: event.target.value })} />
        </label>
      </div>
      {list.isFetching || list.isPending || q !== filters.q ? <p role="status">Загрузка тренировок…</p>
        : statusCode === 401 ? <p role="alert">Сессия истекла. Войдите снова.</p>
        : statusCode === 403 ? <p role="alert">У вас нет доступа к списку тренировок.</p>
        : list.isError ? (
          <div role="alert">Не удалось загрузить тренировки. <button type="button" className="font-bold underline" onClick={() => void list.refetch()}>Повторить</button></div>
        ) : (
          <>
            {list.data.items.length ? (
              <ul className="space-y-3">{list.data.items.map((workout) => (
                <li key={workout.id}>
                  <Link to={`/workouts/${encodeURIComponent(workout.id)}`} className="block rounded-2xl bg-white p-4 shadow-sm">
                    <WorkoutInfo workout={workout} />
                  </Link>
                </li>
              ))}</ul>
            ) : (
              <p>{hasFilters ? 'По заданным условиям ничего не найдено' : 'Доступные тренировки отсутствуют'}</p>
            )}
            {(list.data.totalPages > 1 || filters.page > 0) && (
              <nav aria-label="Страницы тренировок" className="flex items-center justify-between gap-3 text-sm">
                <button type="button" className="font-bold text-lime-800 disabled:text-stone-500" disabled={filters.page === 0}
                  onClick={() => changeFilters({ page: filters.page - 1 })}>Назад</button>
                <span>Страница {list.data.page + 1}</span>
                <button type="button" className="font-bold text-lime-800 disabled:text-stone-500" disabled={filters.page + 1 >= list.data.totalPages}
                  onClick={() => changeFilters({ page: filters.page + 1 })}>Дальше</button>
              </nav>
            )}
          </>
        )}
    </>
  )
}

export function WorkoutsPage() {
  const { workoutId } = useParams()
  const { user, activeRole, signOut } = useAuth()
  const navigate = useNavigate()
  const canCreate = !workoutId && (activeRole === 'ATHLETE' || activeRole === 'TRAINER')

  const startCreate = () => {
    resetWorkoutDraft()
    navigate('/workouts/new')
  }

  return (
    <div className="min-h-full bg-[#f7f7f5] text-[#171c18]">
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
        <h1 className="mt-3 text-4xl font-black">{workoutId ? 'Тренировка' : 'Тренировки'}</h1>
      </header>
      <div className="space-y-4 p-6">
        {workoutId ? (
          <>
            <Link className="font-bold text-lime-800" to={activeRole === 'ADMIN' ? '/' : '/workouts'}>
              {activeRole === 'ADMIN' ? 'На главную' : 'К тренировкам'}
            </Link>
            {user && activeRole && (
              <WorkoutCardScreen id={workoutId} accountKey={`${user.id}:${activeRole}`} onSessionExpired={signOut} />
            )}
          </>
        ) : (
          <>
            {canCreate ? (
              <Button type="primary" block size="large" onClick={startCreate}>
                Создать тренировку
              </Button>
            ) : null}
            <WorkoutList />
          </>
        )}
      </div>
    </div>
  )
}
