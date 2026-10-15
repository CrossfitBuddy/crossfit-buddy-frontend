import { Button, Form, Input, InputNumber, Select } from 'antd'
import type { Rule } from 'antd/es/form'
import { AvatarInput } from './AvatarInput'
import { releaseMockAvatar } from './mockAvatars'
import { fitnessOptions, genderOptions, isValidBirthDate, rxOptions, today, toFormValues } from './profileValues'
import type { ProfileFormValues } from './profileValues'
import type { ProfileResponse } from './types'

const nameRules: Rule[] = [
  { required: true, whitespace: true, message: 'Заполните поле' },
  { max: 100, message: 'Максимум 100 символов' },
]
const textRules = (max: number): Rule[] => [{ max, message: `Максимум ${max} символов` }]
const positiveNumber = (integer: boolean, allowZero = false): Rule[] => [{
  validator: (_, value: number | null | undefined) => {
    if (value == null) return Promise.resolve()
    if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
      return Promise.reject(new Error(allowZero ? 'Введите число не меньше нуля' : 'Введите число больше нуля'))
    }
    if (integer && !Number.isInteger(value)) return Promise.reject(new Error('Введите целое число'))
    if (!integer && (value > 9999.99 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001)) {
      return Promise.reject(new Error('Максимум 9999,99; не более двух знаков после запятой'))
    }
    return Promise.resolve()
  },
}]

export function ProfileForm({ profile, saving, onSave, onCancel }: {
  profile: ProfileResponse
  saving: boolean
  onSave: (values: ProfileFormValues) => void
  onCancel: () => void
}) {
  const [form] = Form.useForm<ProfileFormValues>()
  const cancel = () => {
    const avatarKey = form.getFieldValue('avatarKey') as string | null
    if (avatarKey !== profile.avatarKey) releaseMockAvatar(avatarKey)
    onCancel()
  }
  return (
    <Form<ProfileFormValues> id="profile-edit" className="[&_.ant-form-item]:!mb-4" onReset={(event) => { event.preventDefault(); cancel() }} form={form} layout="vertical" initialValues={toFormValues(profile)} onFinish={onSave} disabled={saving} requiredMark={false} scrollToFirstError>
      <Form.Item name="avatarKey" noStyle><AvatarInput initials={`${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`} originalKey={profile.avatarKey} disabled={saving} /></Form.Item>
      <section>

        <p className="mb-5 text-sm text-stone-500">Email: <span className="break-all text-stone-800">{profile.email}</span></p>
        <Form.Item name="firstName" label="Имя" rules={nameRules}><Input autoComplete="given-name" /></Form.Item>
        <Form.Item name="lastName" label="Фамилия" rules={nameRules}><Input autoComplete="family-name" /></Form.Item>
        <div className="grid grid-cols-2 gap-3">
        <Form.Item name="birthDate" label="Дата рождения" rules={[{ validator: (_, value: string) => !value || isValidBirthDate(value) ? Promise.resolve() : Promise.reject(new Error('Введите корректную дату не позже сегодняшней')) }]}>
          <Input type="date" max={today()} autoComplete="bday" />
        </Form.Item>
        <Form.Item name="gender" label="Пол"><Select allowClear placeholder="Не указан" options={genderOptions} /></Form.Item>
        </div>
        <Form.Item name="city" label="Город" rules={textRules(120)}><Input autoComplete="address-level2" /></Form.Item>
        <Form.Item name="about" label="О себе" rules={textRules(5000)}><Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} showCount maxLength={5000} /></Form.Item>
      </section>
      {profile.activeRole === 'ATHLETE' && <section className="mt-6">
        <h2 className="mb-4 border-b border-stone-200 pb-2 text-sm font-bold text-stone-500">Антропометрия и тренировки</h2>
        <div className="grid grid-cols-2 gap-3">
        <Form.Item name={['athleteProfile', 'heightCm']} label="Рост, см" rules={positiveNumber(true)}><InputNumber className="!w-full" /></Form.Item>
        <Form.Item name={['athleteProfile', 'weightKg']} label="Вес, кг" rules={positiveNumber(false)}><InputNumber className="!w-full" decimalSeparator="," /></Form.Item>
        </div>
        <Form.Item name={['athleteProfile', 'fitnessLevel']} label="Уровень подготовки"><Select allowClear placeholder="Не указан" options={fitnessOptions} /></Form.Item>
        <Form.Item name={['athleteProfile', 'rxPreference']} label="Нагрузка"><Select allowClear placeholder="Не указана" options={rxOptions} /></Form.Item>
      </section>}
      {profile.activeRole === 'TRAINER' && <section className="mt-6">
        <h2 className="mb-4 border-b border-stone-200 pb-2 text-sm font-bold text-stone-500">Тренерское</h2>
        <Form.Item name={['trainerProfile', 'specializations']} label="Специализации" rules={textRules(5000)}><Input.TextArea autoSize={{ minRows: 2, maxRows: 8 }} showCount maxLength={5000} /></Form.Item>
        <Form.Item name={['trainerProfile', 'experienceYears']} label="Стаж, лет" rules={positiveNumber(true, true)}><InputNumber className="!w-full" /></Form.Item>
        <Form.Item name={['trainerProfile', 'methodology']} label="Подход к тренировкам" rules={textRules(5000)}><Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} showCount maxLength={5000} /></Form.Item>
      </section>}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button size="large" onClick={cancel}>Отмена</Button>
        <Button type="primary" htmlType="submit" size="large" loading={saving}>{saving ? 'Сохранение' : 'Сохранить'}</Button>
      </div>
    </Form>
  )
}
