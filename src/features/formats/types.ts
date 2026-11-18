export const formatTypes = ['EMOM', 'FOR_TIME', 'AMRAP', 'TABATA'] as const

export type FormatType = typeof formatTypes[number]

export type ComplexFormat = {
  type: FormatType
  name: string
  description: string
  durationRequired: boolean
  intervalRequired: boolean
}

export type FormatsApi = {
  getFormats: (signal?: AbortSignal) => Promise<ComplexFormat[]>
  updateDescription: (type: FormatType, description: string) => Promise<ComplexFormat>
}
