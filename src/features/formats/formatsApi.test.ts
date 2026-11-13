import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../api/http'
import { formatsApi } from './formatsApi'

const emom = {
  type: 'EMOM',
  name: 'Every Minute on the Minute',
  description: 'Выполняй задание каждую минуту',
  durationRequired: true,
  intervalRequired: true,
}

afterEach(() => vi.restoreAllMocks())

describe('API форматов комплекса', () => {
  it('загружает четыре формата в фиксированном порядке', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [
      { ...emom, type: 'TABATA', name: 'Tabata' },
      { ...emom, type: 'AMRAP', name: 'As Many Rounds As Possible', intervalRequired: false },
      emom,
      { ...emom, type: 'FOR_TIME', name: 'For Time', intervalRequired: false },
    ] })
    const { signal } = new AbortController()

    const formats = await formatsApi.getFormats(signal)

    expect(get).toHaveBeenCalledWith('/api/v1/workouts/formats', { signal })
    expect(formats.map((format) => format.type)).toEqual(['EMOM', 'FOR_TIME', 'AMRAP', 'TABATA'])
    expect(formats[0]).toEqual(emom)
    expect(formats[1].intervalRequired).toBe(false)
  })

  it('игнорирует неизвестные форматы', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: [emom, { ...emom, type: 'CUSTOM' }] })

    await expect(formatsApi.getFormats()).resolves.toEqual([emom])
  })

  it('отклоняет ответ неверной формы', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: [{ ...emom, durationRequired: 600 }] })

    await expect(formatsApi.getFormats()).rejects.toThrow('Сервер вернул некорректный список форматов')
  })

  it('отправляет только описание и возвращает обновлённый формат', async () => {
    const updated = { ...emom, description: 'Сохранённое описание' }
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: updated })

    await expect(formatsApi.updateDescription('EMOM', 'Новое описание')).resolves.toEqual(updated)
    expect(patch).toHaveBeenCalledWith('/api/v1/workouts/EMOM', { description: 'Новое описание' })
  })
})
