import type { UploadFile } from 'antd'

export type ValueType = 'INTEGER' | 'DECIMAL'

export type Measure = {
  name: string
  valueType: ValueType
  unit: string
}

export type Equipment = {
  name: string
  image: UploadFile[]
  properties: Measure[]
}

export type Exercise = {
  name: string
  description: string
  media: UploadFile[]
  metrics: Measure[]
  equipment: Equipment[]
}

export type ExerciseCatalog = {
  metrics: Measure[]
  equipment: string[]
}

export type ExerciseApi = {
  getExercise: (id: string) => Promise<Exercise>
  getCatalog: () => Promise<ExerciseCatalog>
  saveExercise: (exercise: Exercise, id?: string) => Promise<void>
}
