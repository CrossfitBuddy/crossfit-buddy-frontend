import { useQueryClient } from '@tanstack/react-query'
import { Alert, Button, DatePicker, Form, Input, InputNumber, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getApiErrorStatus } from '../api/session'
import { useAuth } from '../app/auth/useAuth'
import { buildOwnWorkoutRequest } from '../features/workouts/buildOwnWorkoutRequest'
import { createOwnWorkoutApi, type CreateOwnWorkoutApi } from '../features/workouts/createOwnWorkoutApi'
import { CreateWorkoutError } from '../features/workouts/createWorkoutTypes'
import { getCreateWorkoutErrorMessage, getCreateWorkoutFieldErrors } from '../features/workouts/createOwnWorkoutErrors'
import { updateOwnWorkoutApi, type UpdateOwnWorkoutApi } from '../features/workouts/updateOwnWorkoutApi'
import {
  formatWorkoutFieldErrors,
  stageIndexesFromFieldErrors,
} from '../features/workouts/workoutFieldErrorLabels'
import { workoutsListQueryKey } from '../features/workouts/workoutsQueryKeys'
import { loadRoundIntoSelection } from '../features/exercises/selection'
import {
  beginRoundForStage,
  consumeWorkoutCreateScrollStage,
  setWorkoutFormReturnPath,
} from '../features/workouts/roundFlow'
import { scrollToWorkoutStage } from '../features/workouts/scrollToWorkoutStage'
import { WorkoutStageSection } from '../features/workouts/WorkoutStageSection'
import { canSaveWorkoutDraft, validateWorkoutDraft } from '../features/workouts/workoutDraftValidation'
import { WOD_STAGE_INDEX } from '../features/workouts/workoutStageParams'
import {
  WORKOUT_STAGE_TITLES,
  getWorkoutDraft,
  patchWorkoutDraft,
  resetWorkoutDraft,
  useWorkoutDraft,
} from '../features/workouts/workoutDraft'

type HeaderFields = {
  name: string
  description?: string
  datetime: Dayjs
  durationMinutes?: number
}

type WorkoutFormLocationState = {
  scrollToStage?: number
}

export type WorkoutFormPageProps = {
  mode: 'create' | 'edit'
  heading: string
  workoutId?: string
  cancelTo?: string
  formKey?: number
  createApi?: CreateOwnWorkoutApi
  updateApi?: UpdateOwnWorkoutApi
  onReloadFromServer?: () => void
}

export function WorkoutFormPage({
  mode,
  heading,
  workoutId,
  cancelTo,
  formKey,
  createApi = createOwnWorkoutApi,
  updateApi = updateOwnWorkoutApi,
  onReloadFromServer,
}: WorkoutFormPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { signOut } = useAuth()
  const draft = useWorkoutDraft()
  const [form] = Form.useForm<HeaderFields>()
  const [showParamErrors, setShowParamErrors] = useState(false)
  const [serverFieldIssues, setServerFieldIssues] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [staleOnServer, setStaleOnServer] = useState(false)
  const canSave = canSaveWorkoutDraft(draft) && !saving

  const formReturnPath = mode === 'edit' && workoutId ? `/workouts/${workoutId}/edit` : '/workouts/new'

  useEffect(() => {
    setWorkoutFormReturnPath(formReturnPath)
  }, [formReturnPath])

  useEffect(() => {
    if (mode !== 'create') return
    if (!getWorkoutDraft().datetime) {
      const now = dayjs().toISOString()
      patchWorkoutDraft({ datetime: now })
      form.setFieldValue('datetime', dayjs(now))
    }
  }, [form, mode])

  useEffect(() => {
    const current = getWorkoutDraft()
    form.setFieldsValue({
      name: current.name,
      description: current.description,
      datetime: current.datetime ? dayjs(current.datetime) : dayjs(),
      durationMinutes: current.durationMinutes ?? undefined,
    })
  }, [form, formKey, draft.name, draft.description, draft.datetime, draft.durationMinutes])

  useEffect(() => {
    const state = location.state as WorkoutFormLocationState | null
    const stageIndex = state?.scrollToStage ?? consumeWorkoutCreateScrollStage()
    if (stageIndex === null || stageIndex === undefined) return

    let attempts = 0
    const tryScroll = () => {
      if (scrollToWorkoutStage(stageIndex) || attempts >= 8) return
      attempts += 1
      requestAnimationFrame(tryScroll)
    }

    requestAnimationFrame(tryScroll)

    if (state?.scrollToStage !== undefined) {
      window.history.replaceState({}, '', `${location.pathname}${location.search}${location.hash}`)
    }
  }, [location.key, location.pathname, location.search, location.hash, location.state])

  const startRound = (stageIndex: number) => {
    beginRoundForStage(stageIndex)
    loadRoundIntoSelection(getWorkoutDraft().stages[stageIndex].round)
    navigate('/exercises')
  }

  const onHeaderChange = () => {
    const values = form.getFieldsValue()
    patchWorkoutDraft({
      name: values.name?.trim() ?? '',
      description: values.description?.trim() ?? '',
      datetime: values.datetime ? values.datetime.toISOString() : '',
      durationMinutes: values.durationMinutes ?? null,
    })
  }

  const onSave = async () => {
    if (saving) return
    onHeaderChange()
    const current = getWorkoutDraft()
    const result = validateWorkoutDraft(current)
    if (!result.ok) {
      setShowParamErrors(true)
      message.error(result.issues[0])
      return
    }
    const request = buildOwnWorkoutRequest(current)
    if (!request) {
      message.error('Не удалось собрать данные тренировки')
      return
    }
    setShowParamErrors(false)
    setServerFieldIssues([])
    setStaleOnServer(false)
    setSaving(true)
    try {
      if (mode === 'edit') {
        if (!workoutId) {
          message.error('Не удалось определить тренировку')
          return
        }
        await updateApi.updateOwnWorkout(workoutId, request)
        await queryClient.invalidateQueries({ queryKey: workoutsListQueryKey })
        await queryClient.invalidateQueries({ queryKey: ['workout-card', workoutId] })
        await queryClient.invalidateQueries({ queryKey: ['workout-edit', workoutId] })
        message.success('Тренировка обновлена')
        navigate(`/workouts/${workoutId}`, { replace: true })
        return
      }

      const { id } = await createApi.createOwnWorkout(request)
      await queryClient.invalidateQueries({ queryKey: workoutsListQueryKey })
      resetWorkoutDraft()
      message.success('Тренировка создана')
      navigate(`/workouts/${id}`, { replace: true })
    } catch (error) {
      const status = error instanceof CreateWorkoutError ? error.status : getApiErrorStatus(error)
      if (status === 401) {
        signOut()
        return
      }
      if (mode === 'edit' && (status === 403 || status === 404 || status === 409)) {
        setStaleOnServer(true)
      }
      const fieldErrors = getCreateWorkoutFieldErrors(error)
      if (fieldErrors.length > 0) {
        setServerFieldIssues(formatWorkoutFieldErrors(fieldErrors))
        setShowParamErrors(true)
        const firstStage = stageIndexesFromFieldErrors(fieldErrors)[0]
        if (firstStage !== undefined) {
          requestAnimationFrame(() => scrollToWorkoutStage(firstStage))
        }
      }
      message.error(getCreateWorkoutErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="workout-create-page bg-[#f7f7f5] pb-8 text-[#171c18]">
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
        <h1 className="mt-3 text-4xl font-black">{heading}</h1>
      </header>

      <div className="flex flex-col gap-5 p-6">
        {staleOnServer ? (
          <div role="alert">
            <Alert
              type="warning"
              showIcon
              title="Не удалось сохранить изменения"
              description={(
                <div className="mt-2 space-y-2">
                  <p>Тренировка могла измениться или редактирование больше недоступно.</p>
                  {onReloadFromServer ? (
                    <Button type="primary" onClick={() => onReloadFromServer()}>
                      Загрузить актуальные данные
                    </Button>
                  ) : null}
                </div>
              )}
            />
          </div>
        ) : null}
        {serverFieldIssues.length > 0 ? (
          <div role="alert">
            <Alert
              type="error"
              showIcon
              title="Исправьте данные тренировки"
              description={(
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {serverFieldIssues.map((line) => <li key={line}>{line}</li>)}
                </ul>
              )}
            />
          </div>
        ) : null}
        <section className="workout-create-header-card" aria-labelledby="workout-header">
          <h2 id="workout-header" className="sr-only">
            Параметры тренировки
          </h2>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            className="workout-create-form w-full"
            initialValues={{
              name: draft.name,
              description: draft.description,
              datetime: draft.datetime ? dayjs(draft.datetime) : dayjs(),
              durationMinutes: draft.durationMinutes ?? undefined,
            }}
            onValuesChange={onHeaderChange}
          >
            <Form.Item name="name" label="Название">
              <Input size="large" placeholder="Утренняя тренировка (необязательно)" />
            </Form.Item>
            <Form.Item name="description" label="Описание">
              <Input.TextArea rows={3} placeholder="Комментарий для атлетов" />
            </Form.Item>
            <Form.Item name="datetime" label="Дата и время" rules={[{ required: true, message: 'Укажите дату' }]}>
              <DatePicker showTime size="large" format="DD.MM.YYYY HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="durationMinutes" label="Длительность, мин">
              <InputNumber
                size="large"
                min={1}
                max={600}
                controls={false}
                inputMode="numeric"
                placeholder="60"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </section>
        {WORKOUT_STAGE_TITLES.map((title, stageIndex) => (
          <WorkoutStageSection
            key={title}
            title={title}
            stageIndex={stageIndex}
            stage={draft.stages[stageIndex]}
            onStartRound={startRound}
            required={stageIndex === WOD_STAGE_INDEX}
            showParamErrors={showParamErrors}
          />
        ))}
        <Button type="primary" block size="large" disabled={!canSave} loading={saving} onClick={() => void onSave()}>
          Сохранить
        </Button>
        {cancelTo ? (
          <Link className="text-center text-sm font-bold text-lime-800" to={cancelTo}>
            Отменить
          </Link>
        ) : null}
        {!canSaveWorkoutDraft(draft) && !saving ? (
          <p className="text-center text-sm text-stone-500">
            Заполните дату и этап WOD: формат, параметры и раунд
          </p>
        ) : null}
      </div>
    </div>
  )
}