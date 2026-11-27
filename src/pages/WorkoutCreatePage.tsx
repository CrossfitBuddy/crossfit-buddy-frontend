import { useEffect } from 'react'
import { createOwnWorkoutApi, type CreateOwnWorkoutApi } from '../features/workouts/createOwnWorkoutApi'
import { setWorkoutFormReturnPath } from '../features/workouts/roundFlow'
import { WorkoutFormPage } from './WorkoutFormPage'

type WorkoutCreatePageProps = {
  createApi?: CreateOwnWorkoutApi
}

export function WorkoutCreatePage({ createApi = createOwnWorkoutApi }: WorkoutCreatePageProps) {
  useEffect(() => {
    setWorkoutFormReturnPath('/workouts/new')
  }, [])

  return <WorkoutFormPage mode="create" heading="Новая тренировка" createApi={createApi} />
}