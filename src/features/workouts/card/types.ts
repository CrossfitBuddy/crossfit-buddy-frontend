export type WorkoutExercise = {
  exerciseId: string
  name: string
  repetitions: number | null
  weightKg: number | null
  durationSeconds: number | null
  distanceMeters: number | null
  heightCm: number | null
  notes: string | null
}

export type WorkoutRound = {
  position: number
  repeatCount: number
  exercises: WorkoutExercise[]
}

export type WorkoutStage = {
  id: string
  name: string
  formatName: string
  timeLimitSeconds: number | null
  targetRounds: number | null
  intervalSeconds: number | null
  rounds: WorkoutRound[]
}

export type MaterialType = 'VIDEO' | 'LINK' | 'FILE'

export type WorkoutMaterial = {
  type: MaterialType
  title: string
  url: string
}

export type WorkoutDetails = {
  id: string
  title: string
  description: string | null
  startsAt: string | null
  durationSeconds: number | null
  stages: WorkoutStage[]
  materials: WorkoutMaterial[]
}

export type WorkoutCardApi = {
  getWorkout: (id: string, signal?: AbortSignal) => Promise<WorkoutDetails>
}

export type WorkoutErrorKind = 'not-found' | 'forbidden' | 'unknown'
