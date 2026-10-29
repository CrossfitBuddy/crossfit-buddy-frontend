import { Avatar, Button, Form, Input, InputNumber, Select } from 'antd'
import type { Rule } from 'antd/es/form'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import type { ProfileFieldError } from './profileApi'
import { numberRules } from './profileValidation'
import { fitnessOptions, genderOptions, isValidBirthDate, rxOptions, today, toFormValues } from './profileValues'
import type { ProfileFormValues } from './profileValues'
import type { ProfileResponse } from './types'

const whiteLabel = (text: string) => <span className="text-white">{text}</span>
const nameRules: Rule[] = [
  { required: true, whitespace: true, message: 'Заполните поле' },
  { max: 100, message: 'Максимум 100 символов' },
]
const textRules = (max: number): Rule[] => [{ max, message: `Максимум ${max} символов` }]
const headingClass = 'mb-5 border-b border-stone-700 pb-3 text-lg font-bold text-lime-400'

export function ProfileForm({ profile, avatar, saving, onSave, onCancel, serverErrors, onValuesChange }: {
  profile: ProfileResponse
  avatar?: ReactNode
  saving: boolean
  onSave: (values: ProfileFormValues) => void
  onCancel: () => void
  serverErrors?: ProfileFieldError[]
  onValuesChange?: () => void
}) {
  const [form] = Form.useForm<ProfileFormValues>()
  useEffect(() => {
    if (serverErrors?.length) form.setFields(serverErrors.map(({ field, message }) => ({ name: field.split('.') as Parameters<typeof form.setFields>[0][number]['name'], errors: [message] })))
  }, [serverErrors, form])
  return (
    <Form<ProfileFormValues>
      id="profile-edit"
      form={form}
      onValuesChange={onValuesChange}
      onSubmitCapture={(event) => { if (saving) { event.preventDefault(); event.stopPropagation() } }}
      noValidate
      className="[&_.ant-form-item]:!mb-5 [&_.ant-input-data-count]:!text-stone-400"
      onReset={(event) => { event.preventDefault(); onCancel() }}
      layout="vertical"
      initialValues={toFormValues(profile)}
      onFinish={onSave}
      disabled={saving}
      requiredMark={false}
      scrollToFirstError
    >
      <div className="mb-7 flex justify-center">
        {avatar ?? <Avatar size={88} className="!bg-[#20321b] !text-3xl !font-bold !text-lime-400">{profile.firstName?.[0]}{profile.lastName?.[0]}</Avatar>}
      </div>
      <section>
        <h2 className={headingClass}>Личные данные</h2>
        <p className="mb-5 text-sm text-stone-400">Email: <span className="break-all text-white">{profile.email}</span></p>
        <Form.Item name="firstName" label={whiteLabel('Имя')} rules={nameRules}><Input autoComplete="given-name" /></Form.Item>
        <Form.Item name="lastName" label={whiteLabel('Фамилия')} rules={nameRules}><Input autoComplete="family-name" /></Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="birthDate" label={whiteLabel('Дата рождения')} rules={[{ validator: (_, value: string) => !value || isValidBirthDate(value) ? Promise.resolve() : Promise.reject(new Error('Введите корректную дату не позже сегодняшней')) }]}>
            <Input type="date" max={today()} autoComplete="bday" />
          </Form.Item>
          <Form.Item name="gender" label={whiteLabel('Пол')}><Select allowClear placeholder="Не указан" options={genderOptions} /></Form.Item>
        </div>
        <Form.Item name="city" label={whiteLabel('Город')} rules={textRules(120)}><Input autoComplete="address-level2" /></Form.Item>
        <Form.Item name="about" label={whiteLabel('О себе')} rules={textRules(5000)}><Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} showCount maxLength={5000} /></Form.Item>
      </section>
      {profile.activeRole === 'ATHLETE' && <section className="mt-8">
        <h2 className={headingClass}>Антропометрия и тренировки</h2>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name={['athleteProfile', 'heightCm']} label={whiteLabel('Рост, см')} rules={numberRules('heightCm')}><InputNumber className="!w-full" decimalSeparator="," /></Form.Item>
          <Form.Item name={['athleteProfile', 'weightKg']} label={whiteLabel('Вес, кг')} rules={numberRules('weightKg')}><InputNumber className="!w-full" decimalSeparator="," /></Form.Item>
        </div>
        <Form.Item name={['athleteProfile', 'fitnessLevel']} label={whiteLabel('Уровень подготовки')}><Select allowClear placeholder="Не указан" options={fitnessOptions} /></Form.Item>
        <Form.Item name={['athleteProfile', 'rxPreference']} label={whiteLabel('Нагрузка')}><Select allowClear placeholder="Не указана" options={rxOptions} /></Form.Item>
      </section>}
      {profile.activeRole === 'TRAINER' && <section className="mt-8">
        <h2 className={headingClass}>Тренерское</h2>
        <Form.Item name={['trainerProfile', 'specializations']} label={whiteLabel('Специализации')} rules={textRules(5000)}><Input.TextArea autoSize={{ minRows: 2, maxRows: 8 }} showCount maxLength={5000} /></Form.Item>
        <Form.Item name={['trainerProfile', 'experienceYears']} label={whiteLabel('Стаж, лет')} rules={numberRules('experienceYears')}><InputNumber className="!w-full" decimalSeparator="," /></Form.Item>
        <Form.Item name={['trainerProfile', 'methodology']} label={whiteLabel('Подход к тренировкам')} rules={textRules(5000)}><Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} showCount maxLength={5000} /></Form.Item>
      </section>}
      <div className="mt-7 grid grid-cols-2 gap-3">
        <Button ghost size="large" onClick={onCancel}>Отмена</Button>
        <Button type="primary" htmlType="submit" size="large" loading={saving}>{saving ? 'Сохранение' : 'Сохранить'}</Button>
      </div>
    </Form>
  )
}
