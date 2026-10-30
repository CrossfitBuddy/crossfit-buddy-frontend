import { AutoComplete, Button, Form, Input } from 'antd'
import type { UploadFile } from 'antd'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { requiredRule } from './exerciseValidation'
import { ImageUpload } from './ImageUpload'
import { MeasureList } from './MeasureList'
import type { Exercise, ExerciseCatalog } from './types'

const emptyExercise: Exercise = { name: '', description: '', media: [], metrics: [], equipment: [] }

const fileList = (event: { fileList: UploadFile[] }) => event.fileList

const trimMeasures = <T extends { name: string; unit: string }>(items: T[] = []) =>
  items.map((item) => ({ ...item, name: item.name.trim(), unit: item.unit.trim() }))

const toExercise = (values: Exercise): Exercise => ({
  name: values.name.trim(),
  description: values.description.trim(),
  media: values.media ?? [],
  metrics: trimMeasures(values.metrics),
  equipment: (values.equipment ?? []).map((item) => ({
    name: item.name.trim(),
    image: item.image ?? [],
    properties: trimMeasures(item.properties),
  })),
})

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      {children}
    </section>
  )
}

type ExerciseFormProps = {
  initialValues?: Exercise
  catalog: ExerciseCatalog
  saving: boolean
  onSave: (exercise: Exercise) => void
  onCancel: () => void
}

export function ExerciseForm({ initialValues = emptyExercise, catalog, saving, onSave, onCancel }: ExerciseFormProps) {
  const [form] = Form.useForm<Exercise>()
  const values = Form.useWatch([], form)
  const [valid, setValid] = useState(false)

  useEffect(() => {
    form.validateFields({ validateOnly: true }).then(
      () => setValid(true),
      (error: { errorFields?: unknown[] }) => setValid(error.errorFields?.length === 0),
    )
  }, [form, values])

  return (
    <Form<Exercise>
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={initialValues}
      disabled={saving}
      onFinish={(exercise) => onSave(toExercise(exercise))}
    >
      <Section title="Основная информация">
        <Form.Item name="name" label="Название" rules={[requiredRule('Название'), { max: 255, message: 'Не более 255 символов' }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="Описание"
          rules={[requiredRule('Описание'), { min: 10, transform: (value: string) => value.trim(), message: 'Не менее 10 символов' }]}
        >
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
        </Form.Item>
        <Form.Item name="media" label="Медиафайлы" valuePropName="fileList" getValueFromEvent={fileList} extra="JPG или PNG">
          <ImageUpload label="Добавить медиафайл" multiple />
        </Form.Item>
      </Section>

      <Section title="Метрики">
        <MeasureList
          form={form}
          name={['metrics']}
          path={['metrics']}
          nameLabel="Название метрики"
          duplicateMessage="Метрики с одинаковыми названиями не допускаются"
          addLabel="Добавить метрику"
          removeLabel="Удалить метрику"
          suggestions={catalog.metrics}
        />
      </Section>

      <Section title="Оборудование">
        <Form.List name="equipment">
          {(fields, { add, remove }) => (
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key} className="rounded-2xl border border-stone-300 bg-stone-100 p-4">
                  <div className="flex items-start gap-2">
                    <Form.Item
                      className="min-w-0 flex-1"
                      name={[field.name, 'name']}
                      label="Название оборудования"
                      rules={[requiredRule('Название оборудования')]}
                    >
                      <AutoComplete
                        options={catalog.equipment.map((value) => ({ value }))}
                        filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
                      />
                    </Form.Item>
                    <Button
                      type="text"
                      danger
                      className="mt-[30px]"
                      aria-label="Удалить оборудование"
                      icon={<Trash2 size={18} />}
                      onClick={() => remove(field.name)}
                    />
                  </div>
                  <Form.Item
                    name={[field.name, 'image']}
                    label="Изображение оборудования"
                    valuePropName="fileList"
                    getValueFromEvent={fileList}
                    extra="JPG или PNG"
                  >
                    <ImageUpload label="Добавить изображение оборудования" maxCount={1} />
                  </Form.Item>
                  <p className="mb-3 font-bold">Свойства</p>
                  <MeasureList
                    form={form}
                    name={[field.name, 'properties']}
                    path={['equipment', field.name, 'properties']}
                    nameLabel="Название свойства"
                    duplicateMessage="Свойства оборудования с одинаковыми названиями не допускаются"
                    addLabel="Добавить свойство"
                    removeLabel="Удалить свойство"
                  />
                </div>
              ))}
              <Button block icon={<Plus size={18} />} onClick={() => add({ name: '', image: [], properties: [] })}>
                Добавить оборудование
              </Button>
            </div>
          )}
        </Form.List>
      </Section>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Button size="large" onClick={onCancel}>Отмена</Button>
        <Button type="primary" htmlType="submit" size="large" disabled={!valid} loading={saving}>
          Сохранить
        </Button>
      </div>
    </Form>
  )
}
