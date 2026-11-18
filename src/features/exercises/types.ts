import type { UploadFile } from 'antd'

export type ValueType = 'INTEGER' | 'DECIMAL'

export type Measure = {
  id?: string
  name: string
  valueType: ValueType
  unit: string
}

export type Equipment = {
  id?: string
  name: string
  image: UploadFile[]
  properties: Measure[]
}

export type Exercise = {
  category: string
  name: string
  description: string
  media: UploadFile[]
  metrics: Measure[]
  equipment: Equipment[]
}

export type ExerciseCatalog = {
  metrics: Measure[]
  equipment: Equipment[]
}

export type ExerciseApi = {
  getExercise: (id: string) => Promise<Exercise>
  getCatalog: () => Promise<ExerciseCatalog>
  saveExercise: (exercise: Exercise, id?: string) => Promise<void>
}
