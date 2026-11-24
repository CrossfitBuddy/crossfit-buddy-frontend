export const formatTypes = ['EMOM', 'FOR_TIME', 'AMRAP', 'FREE'] as const

export type FormatType = typeof formatTypes[number]

export type ComplexFormat = {
  type: FormatType
  name: string
  description: string
}

export type FormatsApi = {
  getFormats: (signal?: AbortSignal) => Promise<ComplexFormat[]>
  updateDescription: (type: FormatType, description: string) => Promise<ComplexFormat>
}
