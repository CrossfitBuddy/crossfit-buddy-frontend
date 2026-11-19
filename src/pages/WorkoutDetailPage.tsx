import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Spin } from 'antd'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorStatus } from '../api/session'
import { useAuth } from '../app/auth/useAuth'
import { fetchWorkoutSummary } from '../features/workouts/workoutDetailApi'

export function WorkoutDetailPage() {
  const { workoutId } = useParams()
  const { signOut } = useAuth()
  const id = workoutId ?? ''

  const workout = useQuery({
    queryKey: ['workout-card', id],
    queryFn: ({ signal }) => fetchWorkoutSummary(id, signal),
    enabled: id.length > 0,
    retry: false,
  })

  if (!id) {
    return <Alert type="warning" showIcon title="Некорректная ссылка на тренировку" />
  }

  if (workout.isPending) {
    return (
      <div role="status" className="flex items-center gap-3 p-6 text-stone-500">
        <Spin />
        Загрузка тренировки…
      </div>
    )
  }

  if (workout.isError) {
    const status = getApiErrorStatus(workout.error)
    if (status === 401) {
      signOut()
      return null
    }
    return (
      <div className="space-y-4 p-6">
        <Alert
          type="error"
          showIcon
          title={status === 404 ? 'Тренировка не найдена' : 'Не удалось загрузить тренировку'}
        />
        <Link className="font-bold text-lime-800" to="/workouts">К тренировкам</Link>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f7f7f5] text-[#171c18]">
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
        <h1 className="mt-3 text-4xl font-black">Тренировка</h1>
      </header>
      <div className="space-y-4 p-6">
        <Link className="font-bold text-lime-800" to="/workouts">К тренировкам</Link>
        <article className="rounded-2xl bg-white p-4">
          <h2 className="text-2xl font-black">{workout.data.title}</h2>
          <p className="mt-2 text-sm text-stone-500">Полная карточка — CB-18712</p>
        </article>
        <Button type="default" block size="large" onClick={() => void workout.refetch()}>
          Обновить
        </Button>
      </div>
    </div>
  )
}