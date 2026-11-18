import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Spin } from 'antd'
import { useState } from 'react'
import { FormatForm } from './FormatForm'
import { formatsApi } from './formatsApi'
import type { ComplexFormat, FormatType, FormatsApi } from './types'

const formatsKey = ['complex-formats']

const abbreviations: Partial<Record<FormatType, string>> = {
  EMOM: 'EMOM',
  AMRAP: 'AMRAP',
}

export function FormatsScreen({ api = formatsApi }: { api?: FormatsApi }) {
  const queryClient = useQueryClient()
  const [editingType, setEditingType] = useState<FormatType | null>(null)
  const [saved, setSaved] = useState(false)
  const formats = useQuery({ queryKey: formatsKey, queryFn: ({ signal }) => api.getFormats(signal), retry: false })
  const save = useMutation({
    mutationFn: ({ type, description }: { type: FormatType; description: string }) => api.updateDescription(type, description),
    onSuccess: async (updated) => {
      await queryClient.cancelQueries({ queryKey: formatsKey })
      queryClient.setQueryData<ComplexFormat[]>(formatsKey, (current) =>
        current?.map((format) => (format.type === updated.type ? updated : format)),
      )
      setEditingType(null)
      setSaved(true)
    },
  })

  const editing = formats.data?.find((format) => format.type === editingType) ?? null
  const editingAbbreviation = editing && abbreviations[editing.type]

  const closeForm = () => {
    setEditingType(null)
    save.reset()
  }

  return (
    <>
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <h1 className="text-3xl font-black">{editing ? editing.name : 'Форматы комплекса'}</h1>
        {editingAbbreviation && editingAbbreviation !== editing.name && <p className="mt-2 text-stone-300">{editingAbbreviation}</p>}
      </header>
      <div className="px-6 py-8">
        {formats.isPending && (
          <div role="status" className="flex items-center gap-3 text-stone-500">
            <Spin />
            Загрузка форматов…
          </div>
        )}
        {formats.isError && (
          <div role="alert">
            <Alert type="error" showIcon title="Не удалось загрузить форматы" description="Проверьте подключение и попробуйте ещё раз" />
            <Button type="primary" block size="large" className="mt-4" loading={formats.isFetching} onClick={() => void formats.refetch()}>
              Повторить загрузку
            </Button>
          </div>
        )}
        {editing && (
          <>
            {save.isError && (
              <div role="alert" className="mb-6">
                <Alert type="error" showIcon title="Не удалось сохранить описание" description="Изменения остались в форме, попробуйте ещё раз" />
              </div>
            )}
            <FormatForm
              key={editing.type}
              format={editing}
              saving={save.isPending}
              onSave={(description) => save.mutate({ type: editing.type, description })}
              onCancel={closeForm}
            />
          </>
        )}
        {formats.data && !editing && (
          <>
            {saved && (
              <div role="status" className="mb-6">
                <Alert type="success" showIcon title="Описание сохранено" />
              </div>
            )}
            {formats.data.length === 0 && <p className="text-stone-500">Форматы не найдены</p>}
            <ul className="space-y-4">
              {formats.data.map((format) => {
                const abbreviation = abbreviations[format.type]
                return (
                  <li key={format.type} className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-black">{format.name}</h2>
                    {abbreviation && abbreviation !== format.name && <p className="text-sm text-stone-500">{abbreviation}</p>}
                    <p className="mt-3 whitespace-pre-wrap">{format.description || 'Описание не задано'}</p>
                    <Button
                      block
                      className="mt-4"
                      aria-label={`Редактировать ${format.name}`}
                      onClick={() => { setSaved(false); save.reset(); setEditingType(format.type) }}
                    >
                      Редактировать
                    </Button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
