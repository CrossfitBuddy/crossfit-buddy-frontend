export type WorkoutExercise = {
  id: string
  name: string
  position: number
  repetitions: number | null
  weightKg: number | null
  durationSeconds: number | null
  distanceMeters: number | null
  heightCm: number | null
  notes: string | null
}

export type WorkoutRound = {
  id: string
  position: number
  repeatCount: number
  exercises: WorkoutExercise[]
}

export type WorkoutStage = {
  id: string
  format: string
  complexFormat: string
  timeLimitSeconds: number | null
  targetRounds: number | null
  intervalSeconds: number | null
  rounds: WorkoutRound[]
}

export type WorkoutMaterial = {
  type: string
  title: string
  url: string
}

export type WorkoutDetails = {
  id: string
  title: string
  description: string | null
  durationSeconds: number | null
  stages: WorkoutStage[]
  materials: WorkoutMaterial[]
}

export type WorkoutCardApi = {
  getWorkout: (id: string, signal?: AbortSignal) => Promise<WorkoutDetails>
}

export type WorkoutErrorKind = 'invalid-id' | 'unauthorized' | 'not-found' | 'forbidden' | 'unknown'
