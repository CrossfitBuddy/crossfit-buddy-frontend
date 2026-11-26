import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Spin } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { getExerciseList } from './exerciseApi'

export function AdminExerciseList() {
  const navigate = useNavigate()
  const exercises = useQuery({
    // ExerciseEditor invalidates this prefix after creating or updating an exercise.
    queryKey: ['exercise-catalog', 'admin-list'],
    queryFn: ({ signal }) => getExerciseList(signal),
    retry: false,
  })
  const items = [...(exercises.data ?? [])].sort((left, right) => left.name.localeCompare(right.name, 'ru'))

  return <>
    <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
      <h1 className="text-3xl font-black">Упражнения</h1>
    </header>
    <div className="space-y-5 px-6 py-8">
      <Button type="primary" block size="large" onClick={() => navigate('/exercises/new')}>Создать упражнение</Button>
      {exercises.isPending && <div role="status" className="flex items-center gap-3 text-stone-500">
        <Spin />Загрузка упражнений…
      </div>}
      {exercises.isError && <div>
        <Alert type="error" showIcon title="Не удалось загрузить упражнения" description="Проверьте подключение и попробуйте ещё раз" />
        <Button block className="mt-4" loading={exercises.isFetching} onClick={() => void exercises.refetch()}>Повторить загрузку</Button>
      </div>}
      {exercises.isSuccess && (items.length === 0
        ? <p className="text-stone-500">Упражнений пока нет</p>
        : <ul className="space-y-4" aria-label="Список упражнений">
          {items.map(item => <li key={item.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">{item.name}</h2>
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-stone-600">{item.description}</p>
            <Link to={`/exercises/${encodeURIComponent(item.id)}/edit`} aria-label={`Редактировать ${item.name}`} className="mt-4 inline-block font-bold text-lime-800 underline">
              Редактировать
            </Link>
          </li>)}
        </ul>)}
    </div>
  </>
}
