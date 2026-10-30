import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Avatar, Button, Select, Spin } from 'antd'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ProfileDetails } from './ProfileDetails'
import { ProfileForm } from './ProfileForm'
import { profileApi } from './mockProfileApi'
import { roleLabels, toUpdateRequest } from './profileValues'
import type { ProfileFormValues } from './profileValues'
import type { ProfileApi, ProfileRole } from './types'

export function ProfileScreen({ api = profileApi, accountKey, activeRole, roles, onRoleChange, onSignOut }: {
  api?: ProfileApi; accountKey?: string; activeRole?: ProfileRole; roles?: ProfileRole[]
  onRoleChange?: (role: ProfileRole) => Promise<boolean>; onSignOut?: () => void
}) {
  const client = useQueryClient()
  const profileKey = ['profile', accountKey ?? 'preview']
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
    mutationFn: async (value: ProfileRole) => {
      if (onRoleChange) { await onRoleChange(value); return }
      return api.switchRole(value)
    },
    onSuccess: (profile) => { if (profile) client.setQueryData(profileKey, profile) },
    onSettled: () => { busy.current = false },
  })
  const profile = query.data ? { ...query.data, activeRole: activeRole ?? query.data.activeRole, roles: roles ?? query.data.roles } : undefined

  useEffect(() => { window.scrollTo(0, 0) }, [editing])

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

  return <div className="min-h-[calc(100dvh-6rem)] bg-[#101914] px-6 pb-8 pt-10 text-white">
    <header className="mb-7">
      <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
      <div className="mt-3 flex items-center gap-2">
        {editing && <Button type="text" className="!text-white" htmlType="reset" form="profile-edit" aria-label="Назад к профилю" icon={<ArrowLeft size={20} />} disabled={save.isPending} />}
        <h1 className={editing ? 'min-w-0 text-2xl font-black' : 'text-4xl font-black'}>{editing ? 'Редактирование' : 'Профиль'}</h1>
      </div>
    </header>
    {query.isPending && <div role="status" aria-label="Загрузка профиля" className="flex items-center gap-3 py-8 text-stone-300"><Spin /><span>Загрузка профиля…</span></div>}
    {query.isError && !profile && <div role="alert"><Alert type="error" showIcon title="Профиль недоступен" description="Не удалось загрузить данные. Попробуйте ещё раз." /><Button type="primary" className="mt-4" size="large" block onClick={() => void query.refetch()} loading={query.isFetching}>Повторить загрузку</Button></div>}
    {profile && <>
      {!editing && <div className="mb-8 flex flex-col items-center">
        <Avatar size={88} className="!bg-[#20321b] !text-3xl !font-bold !text-lime-400">{profile.firstName?.[0]}{profile.lastName?.[0]}</Avatar>
        <h2 className="mt-4 max-w-full break-words text-center text-2xl font-bold">{[profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Пользователь'}</h2>
        {!profile.roles.includes('ADMIN') && profile.roles.includes('ATHLETE') && profile.roles.includes('TRAINER') ? <Select<ProfileRole> aria-label="Активная роль" className="mt-3 !w-40" options={profile.roles.map((value) => ({ value, label: roleLabels[value] }))} value={profile.activeRole} onChange={switchRole} disabled={role.isPending} loading={role.isPending} /> : <p className="mt-3 rounded-full bg-[#20321b] px-5 py-1 text-sm font-bold text-lime-400">{roleLabels[profile.activeRole]}</p>}
        {role.isPending && <p role="status" className="mt-2 text-sm text-stone-400">Переключение роли…</p>}
      </div>}
      {saved && <div role="status" className="mb-5"><Alert type="success" showIcon title="Изменения сохранены" /></div>}
      {(save.isError || role.isError) && <div role="alert" className="mb-5"><Alert type="error" showIcon title={save.isError ? 'Не удалось сохранить изменения' : 'Не удалось переключить роль'} description={save.isError ? 'Данные остались в форме. Попробуйте сохранить ещё раз.' : 'Попробуйте выбрать роль ещё раз.'} /></div>}
      {editing ? <ProfileForm profile={profile} saving={save.isPending} onSave={submit} onCancel={() => { setEditing(false); save.reset() }} /> : <>
        <ProfileDetails profile={profile} />
        <Button type="primary" block size="large" className="mt-8" disabled={role.isPending} onClick={() => { save.reset(); role.reset(); setSaved(false); setEditing(true) }}>Редактировать профиль</Button>
        {onSignOut && <Button type="link" block className="mt-3 !text-stone-300" onClick={onSignOut}>Выйти</Button>}
      </>}
    </>}
  </div>
}
