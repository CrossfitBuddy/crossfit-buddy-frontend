import { App as AntApp, Button } from 'antd'
import type { UploadFile } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { IMAGE_TYPES } from './exerciseValidation'
import { downloadMedia, uploadMedia } from './mediaApi'

type Props = {
  label: string
  video?: boolean
  disabled?: boolean
  fileList?: UploadFile[]
  onChange?: (event: { fileList: UploadFile[] }) => void
}

function Preview({ id, video }: { id: string; video: boolean }) {
  const [url, setUrl] = useState('')
  const [attempt, retry] = useState(0)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function refresh() {
      try {
        const link = await downloadMedia(id, controller.signal)
        if (controller.signal.aborted) return
        setFailed(false)
        setUrl(link.downloadUrl)
        timer = setTimeout(refresh, Math.max(1000, Date.parse(link.expiresAt) - Date.now()))
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      }
    }
    void refresh()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [id, attempt])
  if (failed) return <Button onClick={() => retry(n => n + 1)}>Повторить загрузку предпросмотра</Button>
  if (!url) return null
  return video ? <video controls src={url} className="max-w-full" /> : <img src={url} alt="Изображение" className="max-h-40" />
}

export function ImageUpload({ label, video = false, fileList = [], disabled, onChange }: Props) {
  const { message } = AntApp.useApp()
  const emit = useRef(onChange)
  useEffect(() => { emit.current = onChange }, [onChange])
  const active = useRef<AbortController | null>(null)
  const retryFile = useRef<File | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const file = fileList[0]
  useEffect(() => () => active.current?.abort(), [])

  async function start(source: File) {
    if (video ? !source.type.startsWith('video/') : !IMAGE_TYPES.includes(source.type)) {
      message.error(video ? 'Выберите видеофайл' : 'Можно загрузить только JPG или PNG')
      return
    }
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    retryFile.current = source
    const item: UploadFile = { uid: crypto.randomUUID(), name: source.name, status: 'uploading' }
    emit.current?.({ fileList: [item] })
    try {
      const fileId = await uploadMedia(source, controller.signal)
      if (!controller.signal.aborted) emit.current?.({ fileList: [{ ...item, status: 'done', response: { fileId } }] })
    } catch {
      if (!controller.signal.aborted) emit.current?.({ fileList: [{ ...item, status: 'error' }] })
    }
  }

  return <div>
    <input type="file" ref={input} aria-label={label} hidden disabled={disabled}
      accept={video ? 'video/*' : '.png,.jpg,.jpeg'} onChange={event => {
        const selected = event.target.files?.[0]
        event.target.value = ''
        if (selected) void start(selected)
      }} />
    <Button disabled={disabled} onClick={() => input.current?.click()}>{file ? 'Заменить файл' : label}</Button>
    {file && <div className="mt-2">
      <span>{file.name}</span>
      {file.status === 'uploading' && <span role="status"> Загрузка…</span>}
      {file.status === 'error' && <span role="alert"> Не удалось загрузить файл. <Button onClick={() => retryFile.current && void start(retryFile.current)}>Повторить</Button></span>}
      {file.status === 'done' && <Preview key={file.response.fileId} id={file.response.fileId} video={video} />}
      <Button disabled={disabled} onClick={() => { active.current?.abort(); emit.current?.({ fileList: [] }) }}>Удалить файл</Button>
    </div>}
  </div>
}
