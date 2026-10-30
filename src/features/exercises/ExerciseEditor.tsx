import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, App as AntApp, Button, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { ExerciseForm } from './ExerciseForm'
import { exerciseApi } from './mockExerciseApi'
import type { Exercise, ExerciseApi } from './types'

const LIST_PATH = '/exercises'

export function ExerciseEditor({ id, api = exerciseApi }: { id?: string; api?: ExerciseApi }) {
  const navigate = useNavigate()
  const { message } = AntApp.useApp()
  const catalog = useQuery({ queryKey: ['exercise-catalog'], queryFn: api.getCatalog, retry: false })
  const exercise = useQuery({
    queryKey: ['exercise', id],
    queryFn: () => api.getExercise(id!),
    enabled: Boolean(id),
    retry: false,
  })
  const save = useMutation({
    mutationFn: (value: Exercise) => api.saveExercise(value, id),
    onSuccess: () => {
      message.success('Упражнение сохранено')
      navigate(LIST_PATH)
    },
  })

  const loading = catalog.isPending || (Boolean(id) && exercise.isPending)
  const loadError = catalog.isError || exercise.isError

  return (
    <>
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <h1 className="text-3xl font-black">{id ? 'Редактирование упражнения' : 'Новое упражнение'}</h1>
      </header>
      <div className="px-6 py-8">
        {loading && !loadError && (
          <div role="status" className="flex items-center gap-3 text-stone-500">
            <Spin />
            Загрузка…
          </div>
        )}
        {loadError && (
          <div role="alert">
            <Alert
              type="error"
              showIcon
              title={exercise.isError ? 'Не удалось открыть упражнение' : 'Не удалось загрузить данные формы'}
              description="Попробуйте ещё раз или вернитесь к списку упражнений"
            />
            <Button block size="large" className="mt-4" onClick={() => navigate(LIST_PATH)}>
              К списку упражнений
            </Button>
          </div>
        )}
        {!loading && !loadError && (
          <>
            {save.isError && (
              <div role="alert" className="mb-6">
                <Alert type="error" showIcon title="Не удалось сохранить упражнение. Попробуйте ещё раз" />
              </div>
            )}
            <ExerciseForm
              initialValues={exercise.data}
              catalog={catalog.data!}
              saving={save.isPending}
              onSave={(value) => {
                if (!save.isPending) save.mutate(value)
              }}
              onCancel={() => navigate(LIST_PATH)}
            />
          </>
        )}
      </div>
    </>
  )
}
