import { exerciseParams, formatDuration, isSafeUrl, stageParams } from './workoutCardFormat'
import type { MaterialType, WorkoutDetails } from './types'

const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })

const materialLabels: Record<MaterialType, string> = {
  VIDEO: 'Видео',
  LINK: 'Ссылка',
  FILE: 'Файл',
}

export function WorkoutCard({ workout }: { workout: WorkoutDetails }) {
  const formats = [...new Set(workout.stages.map((stage) => stage.formatName))]

  return (
    <article className="space-y-6">
      <section className="rounded-2xl bg-white p-4">
        <h2 className="text-2xl font-black">{workout.title}</h2>
        {workout.description && <p className="mt-2 whitespace-pre-wrap text-stone-700">{workout.description}</p>}
        <dl className="mt-4 grid gap-2 text-sm">
          {formats.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <dt className="font-bold">Формат комплекса:</dt>
              <dd>{formats.join(', ')}</dd>
            </div>
          )}
          {workout.startsAt && (
            <div className="flex flex-wrap gap-2">
              <dt className="font-bold">Дата и время:</dt>
              <dd><time dateTime={workout.startsAt}>{dateFormat.format(new Date(workout.startsAt))}</time></dd>
            </div>
          )}
          {workout.durationSeconds !== null && (
            <div className="flex flex-wrap gap-2">
              <dt className="font-bold">Длительность:</dt>
              <dd>{formatDuration(workout.durationSeconds)}</dd>
            </div>
          )}
        </dl>
      </section>

      {workout.stages.length === 0 && <p className="text-stone-500">В тренировке пока нет этапов</p>}
      {workout.stages.map((stage) => {
        const params = stageParams(stage)
        return (
          <section key={stage.id} aria-label={stage.name} className="rounded-2xl bg-white p-4">
            <h3 className="text-lg font-black">{stage.name}</h3>
            <p className="text-sm text-stone-500">{[stage.formatName, ...params].join(' · ')}</p>
            <div className="mt-4 space-y-4">
              {stage.rounds.map((round) => (
                <div key={round.position}>
                  <h4 className="font-bold">
                    Раунд {round.position}
                    {round.repeatCount > 1 && <span className="font-normal text-stone-500"> · повторений раунда: {round.repeatCount}</span>}
                  </h4>
                  <ol className="mt-2 space-y-2">
                    {round.exercises.map((exercise, index) => (
                      <li key={`${exercise.exerciseId}-${index}`} className="rounded-xl bg-stone-50 px-3 py-2">
                        <p className="font-semibold">{index + 1}. {exercise.name}</p>
                        {exerciseParams(exercise).length > 0 && <p className="text-sm text-stone-600">{exerciseParams(exercise).join(' · ')}</p>}
                        {exercise.notes && <p className="text-sm italic text-stone-500">{exercise.notes}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {workout.materials.length > 0 && (
        <section aria-label="Дополнительные материалы" className="rounded-2xl bg-white p-4">
          <h3 className="text-lg font-black">Дополнительные материалы</h3>
          <ul className="mt-3 space-y-2">
            {workout.materials.map((material) => (
              <li key={`${material.type}-${material.url}`}>
                <span className="mr-2 text-sm text-stone-500">{materialLabels[material.type]}</span>
                {isSafeUrl(material.url)
                  ? <a href={material.url} target="_blank" rel="noopener noreferrer" className="font-bold !text-lime-700">{material.title}</a>
                  : <span>{material.title}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
