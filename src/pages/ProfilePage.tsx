import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Avatar, Button, Select, Skeleton } from 'antd'
import { ArrowLeft } from 'lucide-react'
import { useRef, useState } from 'react'
import { ProfileDetails } from '../features/profile/ProfileDetails'
import { ProfileForm } from '../features/profile/ProfileForm'
import { getAvatarUrl } from '../features/profile/mockAvatars'
import { profileApi } from '../features/profile/mockProfileApi'
import { roleLabels, toUpdateRequest } from '../features/profile/profileValues'
import type { ProfileFormValues } from '../features/profile/profileValues'
import type { ProfileApi, ProfileRole } from '../features/profile/types'

const profileKey = ['profile']

export function ProfilePage({ api = profileApi }: { api?: ProfileApi }) {
  const client = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const busy = useRef(false)
  const query = useQuery({ queryKey: profileKey, queryFn: api.getProfile, retry: false, staleTime: Infinity })
  const save = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (profile) => {
      client.setQueryData(profileKey, profile)
      setEditing(false)
      setSaved(true)
    },
    onSettled: () => { busy.current = false },
  })
  const role = useMutation({
    mutationFn: api.switchRole,
    onSuccess: (profile) => { client.setQueryData(profileKey, profile) },
    onSettled: () => { busy.current = false },
  })
  const profile = query.data

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

  return <div className="min-h-[calc(100dvh-6rem)] bg-white px-6 pb-8 pt-6">
    <header className="mb-6 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {editing && <Button type="text" htmlType="reset" form="profile-edit" aria-label="Назад к профилю" icon={<ArrowLeft size={20} />} disabled={save.isPending} />}
        <h1 className="text-xl font-bold">{editing ? 'Редактирование' : 'Профиль'}</h1>
      </div>
      {profile && !editing && <Button type="link" className="!p-0" disabled={role.isPending} onClick={() => { save.reset(); role.reset(); setSaved(false); setEditing(true) }}>Изменить</Button>}
    </header>
    {query.isPending && <div role="status" aria-label="Загрузка профиля"><Skeleton active avatar paragraph={{ rows: 8 }} /></div>}
    {query.isError && !profile && <div role="alert"><Alert type="error" showIcon title="Профиль недоступен" description="Не удалось загрузить данные. Попробуйте ещё раз." /><Button className="mt-4" size="large" block onClick={() => void query.refetch()} loading={query.isFetching}>Повторить загрузку</Button></div>}
    {profile && <>
      {!editing && <div className="mb-8 flex flex-col items-center">
        <Avatar size={88} src={getAvatarUrl(profile.avatarKey)} className="!bg-lime-100 !text-3xl !font-bold !text-lime-700">{profile.firstName?.[0]}{profile.lastName?.[0]}</Avatar>
        <h2 className="mt-3 max-w-full break-words text-center text-xl font-bold">{[profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Пользователь'}</h2>
        {profile.roles.length > 1 ? <Select<ProfileRole> aria-label="Активная роль" className="mt-2 !w-36" size="small" options={profile.roles.map((value) => ({ value, label: roleLabels[value] }))} value={profile.activeRole} onChange={switchRole} disabled={role.isPending} loading={role.isPending} /> : <p className="mt-2 rounded-full bg-lime-100 px-5 py-1 text-xs font-bold text-lime-700">{roleLabels[profile.activeRole]}</p>}
        {role.isPending && <p role="status" className="mt-2 text-sm text-stone-500">Переключение роли…</p>}
      </div>}
      {saved && <div role="status" className="mb-4"><Alert type="success" showIcon title="Изменения сохранены" /></div>}
      {(save.isError || role.isError) && <div role="alert" className="mb-4"><Alert type="error" showIcon title={save.isError ? 'Не удалось сохранить изменения' : 'Не удалось переключить роль'} description={save.isError ? 'Данные остались в форме. Попробуйте сохранить ещё раз.' : 'Попробуйте выбрать роль ещё раз.'} /></div>}
      {editing ? <ProfileForm profile={profile} saving={save.isPending} onSave={submit} onCancel={() => { setEditing(false); save.reset() }} /> : <ProfileDetails profile={profile} />}
    </>}
  </div>
}
