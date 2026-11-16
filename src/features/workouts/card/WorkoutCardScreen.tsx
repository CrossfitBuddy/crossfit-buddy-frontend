import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Spin } from 'antd'
import { WorkoutCard } from './WorkoutCard'
import { getWorkoutErrorKind, workoutCardApi } from './workoutCardApi'
import type { WorkoutCardApi } from './types'

type WorkoutCardScreenProps = {
  id: string
  accountKey: string
  api?: WorkoutCardApi
}

export function WorkoutCardScreen({ id, accountKey, api = workoutCardApi }: WorkoutCardScreenProps) {
  const workout = useQuery({
    queryKey: ['workout-card', accountKey, id],
    queryFn: ({ signal }) => api.getWorkout(id, signal),
    retry: false,
    gcTime: 0,
  })

  if (workout.isPending) {
    return (
      <div role="status" className="flex items-center gap-3 text-stone-500">
        <Spin />
        Загрузка тренировки…
      </div>
    )
  }

  if (workout.isError) {
    const kind = getWorkoutErrorKind(workout.error)
    if (kind === 'not-found') {
      return <div role="alert"><Alert type="warning" showIcon title="Тренировка не найдена" description="Возможно, она была удалена" /></div>
    }
    if (kind === 'forbidden') {
      return <div role="alert"><Alert type="error" showIcon title="Нет доступа к этой тренировке" description="Тренировка недоступна для вашей учётной записи" /></div>
    }
    return (
      <div role="alert">
        <Alert type="error" showIcon title="Не удалось загрузить тренировку" description="Проверьте подключение и попробуйте ещё раз" />
        <Button type="primary" block size="large" className="mt-4" loading={workout.isFetching} onClick={() => void workout.refetch()}>
          Повторить загрузку
        </Button>
      </div>
    )
  }

  return <WorkoutCard workout={workout.data} />
}
