import { Button, InputNumber, Select } from 'antd'
import { exercises } from '../exercises/catalog'
import { defaultParamsForCatalogItem, STAGE_FORMAT_CATALOG } from './workoutFormatCatalog'
import { invalidStageParamFields, stageParamFields, formatStageParamsSummary } from './workoutStageParams'
import type { WorkoutFormatType } from './ownWorkoutTypes'
import { patchWorkoutStage, type WorkoutStageDraft } from './workoutDraft'

type WorkoutStageSectionProps = {
  title: string
  stageIndex: number
  stage: WorkoutStageDraft
  onStartRound: (stageIndex: number) => void
  required?: boolean
  showParamErrors?: boolean
}

export function WorkoutStageSection({
  title,
  stageIndex,
  stage,
  onStartRound,
  required,
  showParamErrors,
}: WorkoutStageSectionProps) {
  const paramFields = stage.format ? stageParamFields(stage.format) : []
  const invalidParams = stage.format && showParamErrors ? invalidStageParamFields(stage.format, stage.params) : []

  return (
    <section id={`stage-card-${stageIndex}`} className="workout-stage-card" aria-labelledby={`stage-${stageIndex}`}>
      <div className="workout-stage-card-header">
        <h2 id={`stage-${stageIndex}`} className="workout-stage-card-title">
          {title}
          {required ? <span className="text-sm font-bold text-[#dc2626]"> *</span> : null}
        </h2>
        {stage.format ? (
          <span className="workout-stage-format-badge">
            {STAGE_FORMAT_CATALOG.find((item) => item.format === stage.format)?.label ?? stage.format}
          </span>
        ) : null}
      </div>

      <Select
        className="workout-stage-select"
        size="large"
        placeholder="Формат этапа"
        aria-label={`Формат: ${title}`}
        value={stage.format}
        options={STAGE_FORMAT_CATALOG.map(({ format, label }) => ({ value: format, label }))}
        onChange={(format: WorkoutFormatType) => {
          const catalog = STAGE_FORMAT_CATALOG.find((item) => item.format === format)
          if (!catalog) return
          patchWorkoutStage(stageIndex, {
            format,
            params: defaultParamsForCatalogItem(catalog),
          })
        }}
        onClear={() => {
          patchWorkoutStage(stageIndex, {
            format: null,
            params: {},
            round: [],
          })
        }}
        allowClear
      />

      {stage.format ? (
        <div className="workout-stage-params mt-4">
          {paramFields.length === 0 ? (
            <p className="text-sm text-stone-500">Для этого формата параметры этапа не задаются</p>
          ) : null}
          {paramFields.map((field) => {
            const invalid = invalidParams.some((entry) => entry.key === field.key)
            return (
              <div key={field.key} className="workout-stage-param-row">
                <span className="workout-stage-param-label">{field.label}</span>
                <div className="workout-stage-param-control">
                  <InputNumber
                    className="workout-stage-param-input"
                    size="large"
                    min={field.min}
                    max={field.max}
                    step={field.step ?? 1}
                    controls={false}
                    inputMode="decimal"
                    status={invalid ? 'error' : undefined}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? `param-error-${stageIndex}-${field.key}` : undefined}
                    value={stage.params[field.key]}
                    onChange={(value) => {
                      patchWorkoutStage(stageIndex, {
                        params: {
                          ...stage.params,
                          [field.key]: typeof value === 'number' ? value : field.min,
                        },
                      })
                    }}
                  />
                  <span className="workout-stage-param-suffix">{field.suffix}</span>
                </div>
              </div>
            )
          })}
          {invalidParams.length > 0 ? (
            <p className="text-sm text-red-600" role="alert">
              Проверьте параметры: {invalidParams.map((field) => field.label).join(', ')}
            </p>
          ) : null}
          {paramFields.length > 1 ? (
            <p className="pt-1 text-xs font-bold uppercase tracking-wide text-[#65a30d]">
              {formatStageParamsSummary(stage.format, stage.params)}
            </p>
          ) : null}
        </div>
      ) : null}

      <div id={`stage-round-${stageIndex}`} className="workout-stage-round-block mt-5">
        {stage.round.length > 0 ? (
          <ol className="space-y-2" aria-label={`Упражнения этапа ${title}`}>
            {stage.round.map((item, index) => {
              const exercise = exercises.find((entry) => entry.id === item.exerciseId)
              if (!exercise) return null
              return (
                <li key={item.key} className="workout-stage-round-item">
                  <span className="workout-stage-round-index">{index + 1}</span>
                  <span className="font-bold">{exercise.name}</span>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="workout-stage-empty-round">Раунд не собран</p>
        )}
      </div>

      <Button className="workout-stage-action mt-5" block size="large" onClick={() => onStartRound(stageIndex)}>
        {stage.round.length ? 'Изменить раунд' : 'Собрать раунд'}
      </Button>
    </section>
  )
}