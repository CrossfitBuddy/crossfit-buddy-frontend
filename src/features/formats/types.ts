export const formatCodes = ['EMOM', 'FOR_TIME', 'AMRAP', 'TABATA'] as const

export type FormatCode = typeof formatCodes[number]

export type ComplexFormat = {
  code: FormatCode
  name: string
  description: string
  duration: number | null
  interval: number | null
}

export type FormatsApi = {
  getFormats: (signal?: AbortSignal) => Promise<ComplexFormat[]>
  updateDescription: (code: FormatCode, description: string) => Promise<void>
}
