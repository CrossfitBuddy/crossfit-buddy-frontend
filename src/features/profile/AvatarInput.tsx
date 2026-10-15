import { Avatar, Button, Upload } from 'antd'
import { useState } from 'react'
import { createMockAvatar, getAvatarUrl, releaseMockAvatar } from './mockAvatars'

export function AvatarInput({ value, onChange, initials, originalKey, disabled }: {
  value?: string | null
  onChange?: (key: string | null) => void
  initials: string
  originalKey: string | null
  disabled: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const replace = (next: string | null) => {
    if (value && value !== originalKey) releaseMockAvatar(value)
    setError(null)
    onChange?.(next)
  }
  return <div className="mb-6 flex flex-col items-center gap-2">
    <Avatar size={88} src={getAvatarUrl(value ?? null)} className="!bg-lime-100 !text-3xl !font-bold !text-lime-700">{initials}</Avatar>
    <Upload accept="image/jpeg,image/png,image/webp" showUploadList={false} disabled={disabled} beforeUpload={(file) => {
      try { replace(createMockAvatar(file)) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Не удалось открыть изображение') }
      return Upload.LIST_IGNORE
    }}>
      <Button size="small" type="link">Заменить аватар</Button>
    </Upload>
    {value && <Button size="small" type="link" danger onClick={() => replace(null)}>Удалить аватар</Button>}
    <p className="text-xs text-stone-400">JPG, PNG или WebP, до 5 МБ</p>
    {error && <p role="alert" className="text-center text-sm text-red-600">{error}</p>}
  </div>
}
