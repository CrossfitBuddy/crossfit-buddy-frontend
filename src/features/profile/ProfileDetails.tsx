import type { ReactNode } from 'react'
import { Tag } from 'antd'
import { fitnessOptions, genderOptions, rxOptions } from './profileValues'
import type { ProfileResponse } from './types'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-sm text-stone-500">{label}</dt><dd className="mt-0.5 whitespace-pre-wrap break-words text-sm">{children ?? 'Не указано'}</dd></div>
}

const labelFor = (options: { value: string; label: string }[], value: string | null | undefined) => options.find((option) => option.value === value)?.label
const formatDate = (date: string | null) => date ? new Intl.DateTimeFormat('ru-RU').format(new Date(`${date}T12:00:00`)) : null
const yearsLabel = (years: number) => {
  const last = years % 10
  const lastTwo = years % 100
  return last === 1 && lastTwo !== 11 ? 'год' : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'года' : 'лет'
}
const headingClass = 'mb-3 border-b border-stone-200 pb-2 text-sm font-bold text-stone-500'

export function ProfileDetails({ profile }: { profile: ProfileResponse }) {
  const athlete = profile.athleteProfile
  const trainer = profile.trainerProfile
  return <>
    <section>
      <h2 className={headingClass}>Основное</h2>
      <dl className="space-y-3">
        <Field label="Email">{profile.email}</Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Дата рождения">{formatDate(profile.birthDate)}</Field>
          <Field label="Пол">{labelFor(genderOptions, profile.gender)}</Field>
        </div>
        <Field label="Город">{profile.city}</Field>
        <Field label="О себе">{profile.about}</Field>
      </dl>
    </section>
    {profile.activeRole === 'ATHLETE' && <section className="mt-7">
      <h2 className={headingClass}>Антропометрия и тренировки</h2>
      <dl className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Рост">{athlete?.heightCm != null ? `${athlete.heightCm} см` : null}</Field>
          <Field label="Вес">{athlete?.weightKg != null ? `${athlete.weightKg.toLocaleString('ru-RU')} кг` : null}</Field>
          <Field label="Уровень">{labelFor(fitnessOptions, athlete?.fitnessLevel)}</Field>
        </div>
        <Field label="Предпочтение">{labelFor(rxOptions, athlete?.rxPreference)}</Field>
      </dl>
    </section>}
    {profile.activeRole === 'TRAINER' && <section className="mt-7">
      <h2 className={headingClass}>Тренерское</h2>
      <dl className="space-y-3">
        <Field label="Опыт">{trainer?.experienceYears != null ? `${trainer.experienceYears} ${yearsLabel(trainer.experienceYears)}` : null}</Field>
        <Field label="Специализации">{trainer?.specializations ? trainer.specializations.split(',').map((item, index) => <Tag color="green" className="!max-w-full !whitespace-normal !break-words" key={index}>{item.trim()}</Tag>) : null}</Field>
        <Field label="Методика">{trainer?.methodology}</Field>
      </dl>
    </section>}
  </>
}
