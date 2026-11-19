import { Button, DatePicker, Form, Input, InputNumber, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { buildOwnWorkoutRequest } from '../features/workouts/buildOwnWorkoutRequest'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadRoundIntoSelection } from '../features/exercises/selection'
import { beginRoundForStage, consumeWorkoutCreateScrollStage } from '../features/workouts/roundFlow'
import { scrollToWorkoutStage } from '../features/workouts/scrollToWorkoutStage'
import { WorkoutStageSection } from '../features/workouts/WorkoutStageSection'
import { canSaveWorkoutDraft, validateWorkoutDraft } from '../features/workouts/workoutDraftValidation'
import { WOD_STAGE_INDEX } from '../features/workouts/workoutStageParams'
import {
  WORKOUT_STAGE_TITLES,
  getWorkoutDraft,
  patchWorkoutDraft,
  useWorkoutDraft,
} from '../features/workouts/workoutDraft'

type HeaderFields = {
  name: string
  description?: string
  datetime: Dayjs
  durationMinutes?: number
}

type WorkoutCreateLocationState = {
  scrollToStage?: number
}

export function WorkoutCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const draft = useWorkoutDraft()
  const [form] = Form.useForm<HeaderFields>()
  const [showParamErrors, setShowParamErrors] = useState(false)
  const canSave = canSaveWorkoutDraft(draft)

  useEffect(() => {
    if (!getWorkoutDraft().datetime) {
      const now = dayjs().toISOString()
      patchWorkoutDraft({ datetime: now })
      form.setFieldValue('datetime', dayjs(now))
    }
  }, [form])

  useEffect(() => {
    const state = location.state as WorkoutCreateLocationState | null
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

  const onSave = () => {
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
    message.success('Данные готовы к отправке. API — в задаче CB-18982')
  }

  return (
    <div className="workout-create-page bg-[#f7f7f5] pb-8 text-[#171c18]">
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
        <h1 className="mt-3 text-4xl font-black">Новая тренировка</h1>
      </header>

      <div className="flex flex-col gap-5 p-6">
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
        <Button type="primary" block size="large" disabled={!canSave} onClick={onSave}>
          Сохранить
        </Button>
        {!canSave ? (
          <p className="text-center text-sm text-stone-500">
            Заполните дату и этап WOD: формат, параметры и раунд
          </p>
        ) : (
          <p className="text-center text-sm text-stone-500">Отправка на сервер — в задаче CB-18982</p>
        )}
      </div>
    </div>
  )
}