import { describe, expect, it } from 'vitest'
import { parseFormats } from './formatsApi'

describe('parseFormats', () => {
  it('возвращает четыре формата в фиксированном порядке', () => {
    const formats = parseFormats([
      { code: 'TABATA', description: 'д4' },
      { code: 'AMRAP', description: 'д3' },
      { code: 'EMOM', description: 'д1' },
      { code: 'FOR_TIME', description: 'д2' },
    ])

    expect(formats.map((format) => format.code)).toEqual(['EMOM', 'FOR_TIME', 'AMRAP', 'TABATA'])
  })

  it('подставляет название и пустые значения, если сервер их не прислал', () => {
    const [format] = parseFormats([{ code: 'FOR_TIME', description: null }])

    expect(format).toEqual({ code: 'FOR_TIME', name: 'For Time', description: '', duration: null, interval: null })
  })

  it('игнорирует неизвестные форматы', () => {
    const formats = parseFormats([{ code: 'EMOM', description: 'д' }, { code: 'CUSTOM', description: 'чужой' }])

    expect(formats.map((format) => format.code)).toEqual(['EMOM'])
  })

  it('отклоняет ответ неверной формы', () => {
    expect(() => parseFormats({ code: 'EMOM' })).toThrow('Сервер вернул некорректный список форматов')
  })
})
