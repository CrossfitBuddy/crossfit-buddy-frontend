export type WorkoutFieldError = {
  field: string
  code: string
  message: string
}

export type WorkoutErrorBody = {
  code?: string
  message?: string
  fieldErrors?: WorkoutFieldError[]
}

export class CreateWorkoutError extends Error {
  readonly status: number
  readonly code?: string
  readonly fieldErrors: WorkoutFieldError[]

  constructor(status: number, message: string, code?: string, fieldErrors: WorkoutFieldError[] = []) {
    super(message)
    this.name = 'CreateWorkoutError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}