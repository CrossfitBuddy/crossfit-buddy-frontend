import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Spin } from 'antd'
import { useState } from 'react'
import { FormatForm } from './FormatForm'
import { formatsApi } from './formatsApi'
import type { ComplexFormat, FormatCode, FormatsApi } from './types'

const formatsKey = ['complex-formats']

const subtitles: Record<FormatCode, string> = {
  EMOM: 'Every Minute on the Minute',
  FOR_TIME: 'For Time',
  AMRAP: 'As Many Rounds As Possible',
  TABATA: 'Tabata',
}

export function FormatsScreen({ api = formatsApi }: { api?: FormatsApi }) {
  const queryClient = useQueryClient()
  const [editingCode, setEditingCode] = useState<FormatCode | null>(null)
  const [saved, setSaved] = useState(false)
  const formats = useQuery({ queryKey: formatsKey, queryFn: ({ signal }) => api.getFormats(signal), retry: false })
  const save = useMutation({
    mutationFn: ({ code, description }: { code: FormatCode; description: string }) => api.updateDescription(code, description),
    onSuccess: (_, { code, description }) => {
      queryClient.setQueryData<ComplexFormat[]>(formatsKey, (current) =>
        current?.map((format) => (format.code === code ? { ...format, description } : format)),
      )
      void queryClient.invalidateQueries({ queryKey: formatsKey })
      setEditingCode(null)
      setSaved(true)
    },
  })

  const editing = formats.data?.find((format) => format.code === editingCode) ?? null

  const closeForm = () => {
    setEditingCode(null)
    save.reset()
  }

  return (
    <>
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <h1 className="text-3xl font-black">{editing ? editing.name : 'Форматы комплекса'}</h1>
        {editing && subtitles[editing.code] !== editing.name && <p className="mt-2 text-stone-300">{subtitles[editing.code]}</p>}
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
        {formats.isSuccess && editing && (
          <>
            {save.isError && (
              <div role="alert" className="mb-6">
                <Alert type="error" showIcon title="Не удалось сохранить описание" description="Изменения остались в форме, попробуйте ещё раз" />
              </div>
            )}
            <FormatForm
              key={editing.code}
              format={editing}
              saving={save.isPending}
              onSave={(description) => save.mutate({ code: editing.code, description })}
              onCancel={closeForm}
            />
          </>
        )}
        {formats.isSuccess && !editing && (
          <>
            {saved && (
              <div role="status" className="mb-6">
                <Alert type="success" showIcon title="Описание сохранено" />
              </div>
            )}
            <ul className="space-y-4">
              {formats.data.map((format) => (
                <li key={format.code} className="rounded-2xl bg-white p-5 shadow-sm">
                  <h2 className="text-xl font-black">{format.name}</h2>
                  {subtitles[format.code] !== format.name && <p className="text-sm text-stone-500">{subtitles[format.code]}</p>}
                  <p className="mt-3 whitespace-pre-wrap">{format.description || 'Описание не задано'}</p>
                  <Button
                    block
                    className="mt-4"
                    aria-label={`Редактировать ${format.name}`}
                    onClick={() => { setSaved(false); save.reset(); setEditingCode(format.code) }}
                  >
                    Редактировать
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
