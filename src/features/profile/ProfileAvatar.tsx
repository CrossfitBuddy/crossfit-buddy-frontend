import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Avatar, Button, Spin } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AvatarApi } from './avatarApi'
import { validateAvatar } from './avatarApi'
import { ProfileError } from './profileApi'
import type { ProfileResponse } from './types'

function AvatarImage({ blob }: { blob: Blob }) {
  const imageRef = useCallback((node: HTMLImageElement | null) => {
    if (!node) return
    const url = URL.createObjectURL(blob)
    node.src = url
    return () => URL.revokeObjectURL(url)
  }, [blob])
  return <img ref={imageRef} alt="Аватар пользователя" className="h-[88px] w-[88px] rounded-full object-cover" />
}

export function ProfileAvatar({ profile, api, controls = false, onSessionExpired, onBusyChange }: {
  profile: ProfileResponse; api?: AvatarApi; controls?: boolean; onSessionExpired?: () => void; onBusyChange?: (busy: boolean) => void
}) {
  const client = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const busy = useRef(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const [validationError, setValidationError] = useState('')
  const [notice, setNotice] = useState('')
  const key = ['avatar', profile.id]
  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => api!.getAvatar(signal), enabled: !!api, retry: false, staleTime: 30000, refetchOnWindowFocus: () => !busy.current, refetchOnReconnect: () => !busy.current })
  const mutation = useMutation({
    onMutate: () => client.cancelQueries({ queryKey: key }),
    mutationFn: async (file: File | null) => {
      if (!api) throw new Error('API аватара недоступно')
      if (file) await api.replaceAvatar(file)
      else await api.deleteAvatar()
      return file
    },
    onSuccess: (file) => {
      if (!mounted.current) return
      client.setQueryData(key, file)
      setNotice(file ? 'Аватар сохранён' : 'Аватар удалён')
      void client.invalidateQueries({ queryKey: ['profile', profile.id] })
    },
    onSettled: () => { busy.current = false; if (mounted.current) onBusyChange?.(false) },
  })
  const error = mutation.error ?? query.error
  useEffect(() => {
    if (error instanceof ProfileError && error.status === 401) onSessionExpired?.()
  }, [error, onSessionExpired])
  const submit = (file: File | null) => {
    if (busy.current || query.isFetching) return
    setNotice('')
    mutation.reset()
    const error = file && validateAvatar(file)
    setValidationError(error || '')
    if (error) return
    busy.current = true
    onBusyChange?.(true)
    mutation.mutate(file)
  }
  return <div className="flex w-full flex-col items-center gap-3">
    {query.data ? <AvatarImage blob={query.data} /> : <Avatar size={88} className="!bg-[#20321b] !text-3xl !font-bold !text-lime-400">{profile.initials ?? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`}</Avatar>}
    {api && query.isFetching && <span role="status" className="flex items-center gap-2 text-sm text-stone-400"><Spin size="small" />Загрузка аватара…</span>}
    {api && controls && <>
      <input ref={input} type="file" className="hidden" aria-label="Файл аватара" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" disabled={mutation.isPending || query.isFetching}
        onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) submit(file) }} />
      <div className="flex flex-wrap justify-center gap-2">
        <Button ghost disabled={mutation.isPending || query.isFetching} onClick={() => input.current?.click()}>{query.data ? 'Заменить аватар' : 'Загрузить аватар'}</Button>
        {query.data && <Button danger ghost disabled={mutation.isPending || query.isFetching} onClick={() => submit(null)}>Удалить аватар</Button>}
      </div>
      <p className="text-center text-xs text-stone-400">JPEG, PNG или WEBP, до 5 МБ. Изменения сохраняются сразу.</p>
      {mutation.isPending && <span role="status" className="text-sm text-stone-300">Сохранение аватара…</span>}
      {notice && <span role="status" className="text-sm text-lime-400">{notice}</span>}
    </>}
    {(validationError || error) && <div className="w-full"><Alert type="error" showIcon title={validationError || (error instanceof Error ? error.message : 'Не удалось обновить аватар')} /></div>}
    {query.isError && <Button ghost onClick={() => void query.refetch()} disabled={mutation.isPending} loading={query.isFetching}>Повторить загрузку аватара</Button>}
  </div>
}