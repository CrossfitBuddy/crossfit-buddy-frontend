import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../api/http'
import { formatsApi } from './formatsApi'

const emom = {
  type: 'EMOM',
  name: 'Every Minute on the Minute',
  description: 'Выполняй задание каждую минуту',
}

afterEach(() => vi.restoreAllMocks())

describe('API форматов комплекса', () => {
  it('загружает четыре формата в фиксированном порядке', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [
      { ...emom, type: 'FREE', name: 'Free Format' },
      { ...emom, type: 'AMRAP', name: 'As Many Rounds As Possible' },
      emom,
      { ...emom, type: 'FOR_TIME', name: 'For Time' },
    ] })
    const { signal } = new AbortController()

    const formats = await formatsApi.getFormats(signal)

    expect(get).toHaveBeenCalledWith('/v1/complex/formats', { signal })
    expect(formats.map((format) => format.type)).toEqual(['EMOM', 'FOR_TIME', 'AMRAP', 'FREE'])
    expect(formats[0]).toEqual(emom)
  })

  it('игнорирует неизвестные форматы', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: [emom, { ...emom, type: 'CUSTOM' }] })

    await expect(formatsApi.getFormats()).resolves.toEqual([emom])
  })

  it('отклоняет ответ неверной формы', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: [{ ...emom, description: 600 }] })

    await expect(formatsApi.getFormats()).rejects.toThrow('Сервер вернул некорректный список форматов')
  })

  it('отправляет только описание и возвращает обновлённый формат', async () => {
    const updated = { ...emom, description: 'Сохранённое описание' }
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: updated })

    await expect(formatsApi.updateDescription('EMOM', 'Новое описание')).resolves.toEqual(updated)
    expect(patch).toHaveBeenCalledWith('/v1/complex/EMOM', { description: 'Новое описание' })
  })
})
