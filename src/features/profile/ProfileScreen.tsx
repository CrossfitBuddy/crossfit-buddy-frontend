import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Select, Spin } from 'antd'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ProfileAvatar } from './ProfileAvatar'
import type { AvatarApi } from './avatarApi'
import { ProfileDetails } from './ProfileDetails'
import { ProfileForm } from './ProfileForm'
import { ProfileError } from './profileApi'
import { roleLabels, toUpdateRequest } from './profileValues'
import type { ProfileFormValues } from './profileValues'
import type { ProfileApi, ProfileResponse, ProfileRole } from './types'

type Props = {
  api: Pick<ProfileApi, 'getProfile' | 'updateProfile'> & Partial<Pick<ProfileApi, 'switchRole'>>
  avatarApi?: AvatarApi
  accountId?: string
  activeRole?: ProfileRole
  roles?: ProfileRole[]
  onRoleChange?: (role: ProfileRole) => Promise<void>
  onSaved?: (profile: ProfileResponse) => boolean
  onSessionExpired?: () => void
  onSignOut?: () => void
}
const message = (error: unknown, fallback: string) => error instanceof ProfileError ? error.message : fallback

export function ProfileScreen({ api, avatarApi, accountId, activeRole, roles, onRoleChange, onSaved, onSessionExpired, onSignOut }: Props) {
  const client = useQueryClient()
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [storeWarning, setStoreWarning] = useState('')
  const busy = useRef(false)
  const queryKey = ['profile', accountId ?? 'preview', activeRole ?? 'preview']
  const query = useQuery({
    queryKey, queryFn: ({ signal }) => api.getProfile(signal), retry: false, staleTime: 30000,
    refetchOnWindowFocus: !editing,
  })
  const save = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (profile) => {
      try { if (onSaved && !onSaved(profile)) return }
      catch { setStoreWarning('Профиль сохранён на сервере, но данные аккаунта не обновились. Войдите заново.') }
      client.setQueryData(queryKey, profile)
      setEditing(false)
      setSaved(true)
    },
    onSettled: () => { busy.current = false },
  })
  const role = useMutation({
    mutationFn: async (value: ProfileRole) => {
      if (onRoleChange) { await onRoleChange(value); return }
      if (api.switchRole) return api.switchRole(value)
      throw new Error('Переключение роли недоступно')
    },
    onSuccess: (profile) => { if (profile) client.setQueryData(queryKey, profile) },
    onSettled: () => { busy.current = false },
  })
  const profile = query.data ? { ...query.data, activeRole: activeRole ?? query.data.activeRole, roles: roles ?? query.data.roles } : undefined
  const saving = save.isPending || role.isPending
  const error = save.error ?? role.error
  const unauthorized = [query.error, error].some((value) => value instanceof ProfileError && value.status === 401)

  useEffect(() => { window.scrollTo(0, 0) }, [editing])
  useEffect(() => { if (unauthorized) onSessionExpired?.() }, [unauthorized, onSessionExpired])

  const submit = (values: ProfileFormValues) => {
    if (!profile || busy.current) return
    busy.current = true
    save.mutate(toUpdateRequest(values, profile.activeRole))
  }
  const switchRole = (value: ProfileRole) => {
    if (busy.current || editing) return
    busy.current = true
    setSaved(false)
    save.reset()
    role.mutate(value)
  }
  const refresh = async () => {
    if (busy.current) return
    busy.current = true
    const result = await query.refetch()
    if (result.isSuccess) {
      setEditing(false)
      setSaved(false)
      save.reset()
      role.reset()
    }
    busy.current = false
  }

  return <div className="min-h-[calc(100dvh-6rem)] bg-[#101914] px-6 pb-8 pt-10 text-white">
    <header className="mb-7">
      <p className="text-sm font-bold text-lime-400">CrossfitBuddy</p>
      <div className="mt-3 flex items-center gap-2">
        {editing && <Button type="text" className="!text-white" htmlType="reset" form="profile-edit" aria-label="Назад к профилю" icon={<ArrowLeft size={20} />} disabled={saving || avatarBusy} />}
        <h1 className={editing ? 'min-w-0 text-2xl font-black' : 'text-4xl font-black'}>{editing ? 'Редактирование' : 'Профиль'}</h1>
      </div>
    </header>
    {query.isPending && <div role="status" aria-label="Загрузка профиля" className="flex items-center gap-3 py-8 text-stone-300"><Spin /><span>Загрузка профиля…</span></div>}
    {query.isError && <div role="alert" className="mb-5">
      <Alert type="error" showIcon title={profile ? "Не удалось обновить профиль" : "Профиль недоступен"} description={message(query.error, 'Не удалось загрузить данные. Попробуйте ещё раз.')} />
      <Button type="primary" className="mt-4" size="large" block onClick={() => void refresh()} loading={query.isFetching} disabled={saving || avatarBusy}>Повторить загрузку</Button>
    </div>}
    {profile && <>
      {!editing && <div className="mb-8 flex flex-col items-center">
        <ProfileAvatar profile={profile} api={avatarApi} controls onBusyChange={setAvatarBusy} onSessionExpired={onSessionExpired} />
        <h2 className="mt-4 max-w-full break-words text-center text-2xl font-bold">{[profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Пользователь'}</h2>
        {profile.roles.length > 1 ? <Select<ProfileRole> aria-label="Активная роль" className="mt-3 !w-40" options={profile.roles.map((value) => ({ value, label: roleLabels[value] }))} value={profile.activeRole} onChange={switchRole} disabled={avatarBusy || role.isPending || query.isFetching} loading={role.isPending} /> : <p className="mt-3 rounded-full bg-[#20321b] px-5 py-1 text-sm font-bold text-lime-400">{roleLabels[profile.activeRole]}</p>}
        {role.isPending && <p role="status" className="mt-2 text-sm text-stone-400">Переключение роли…</p>}
      </div>}
      {saved && <div role="status" className="mb-5"><Alert type="success" showIcon title="Изменения сохранены" /></div>}
      {storeWarning && <div role="alert" className="mb-5"><Alert type="warning" showIcon title={storeWarning} /></div>}
      {error && <div role="alert" className="mb-5">
        <Alert type="error" showIcon title={save.isError ? 'Не удалось сохранить изменения' : 'Не удалось переключить роль'} description={message(error, save.isError ? 'Данные остались в форме. Попробуйте сохранить ещё раз.' : 'Попробуйте выбрать роль ещё раз.')} />
        {error instanceof ProfileError && error.status === 409 && <Button ghost block className="mt-4" loading={query.isFetching} onClick={() => void refresh()}>Загрузить заново и сбросить правки</Button>}
      </div>}
      {editing ? <ProfileForm
        profile={profile}
        avatar={<ProfileAvatar profile={profile} api={avatarApi} onSessionExpired={onSessionExpired} />}
        saving={saving}
        onSave={submit}
        serverErrors={save.error instanceof ProfileError ? save.error.fields : undefined}
        onValuesChange={() => { if (!save.isPending && save.isError) save.reset() }}
        onCancel={() => { setEditing(false); save.reset() }}
      /> : <>
        <ProfileDetails profile={profile} />
        <Button type="primary" block size="large" className="mt-8" disabled={avatarBusy || role.isPending || query.isFetching} onClick={() => { save.reset(); role.reset(); setSaved(false); setStoreWarning(''); setEditing(true) }}>Редактировать профиль</Button>
        <Button ghost block size="large" className="mt-3" loading={query.isFetching} disabled={saving || avatarBusy} onClick={() => void refresh()}>Обновить данные</Button>
        {onSignOut && <Button type="link" block className="mt-3 !text-stone-300" disabled={saving || avatarBusy} onClick={onSignOut}>Выйти</Button>}
      </>}
    </>}
  </div>
}
