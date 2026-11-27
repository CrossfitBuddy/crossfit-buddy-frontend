import { useQuery } from '@tanstack/react-query'
import { Alert, Spin } from 'antd'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorStatus } from '../api/session'
import { useAuth } from '../app/auth/useAuth'
import { fetchOwnWorkoutApi, type FetchOwnWorkoutApi } from '../features/workouts/fetchOwnWorkoutApi'
import { setWorkoutFormReturnPath } from '../features/workouts/roundFlow'
import { replaceWorkoutDraft } from '../features/workouts/workoutDraft'
import { updateOwnWorkoutApi, type UpdateOwnWorkoutApi } from '../features/workouts/updateOwnWorkoutApi'
import { WorkoutFormPage } from './WorkoutFormPage'

type WorkoutEditPageProps = {
  fetchApi?: FetchOwnWorkoutApi
  updateApi?: UpdateOwnWorkoutApi
}

export function WorkoutEditPage({ fetchApi = fetchOwnWorkoutApi, updateApi = updateOwnWorkoutApi }: WorkoutEditPageProps) {
  const { workoutId } = useParams()
  const { signOut } = useAuth()
  const id = workoutId ?? ''

  useEffect(() => {
    if (!id) return
    setWorkoutFormReturnPath(`/workouts/${id}/edit`)
  }, [id])

  const workout = useQuery({
    queryKey: ['workout-edit', id],
    queryFn: async ({ signal }) => {
      const draft = await fetchApi.fetchOwnWorkout(id, signal)
      replaceWorkoutDraft(draft)
      return draft
    },
    enabled: id.length > 0,
    retry: false,
    staleTime: 0,
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
        <Link className="font-bold text-lime-800" to="/workouts">
          К тренировкам
        </Link>
      </div>
    )
  }

  return (
    <WorkoutFormPage
      mode="edit"
      workoutId={id}
      heading="Редактирование"
      updateApi={updateApi}
      cancelTo={`/workouts/${id}`}
      formKey={workout.dataUpdatedAt}
      onReloadFromServer={() => void workout.refetch()}
    />
  )
}