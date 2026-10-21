export type ProfileRole = 'ATHLETE' | 'TRAINER' | 'ADMIN'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type FitnessLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type RxPreference = 'RX' | 'SCALED'

export type AthleteProfile = {
  heightCm: number | null
  weightKg: number | null
  fitnessLevel: FitnessLevel | null
  rxPreference: RxPreference | null
}

export type TrainerProfile = {
  specializations: string | null
  experienceYears: number | null
  methodology: string | null
}

export type PersonalProfile = {
  firstName: string | null
  lastName: string | null
  birthDate: string | null
  gender: Gender | null
  city: string | null
  about: string | null
  avatarKey: string | null
}

export type ProfileResponse = PersonalProfile & {
  displayName?: string
  avatarUrl?: string | null
  initials?: string
  id: string
  email: string
  roles: ProfileRole[]
  activeRole: ProfileRole
  athleteProfile: AthleteProfile | null
  trainerProfile: TrainerProfile | null
}

export type UpdateProfileRequest = Omit<PersonalProfile, 'avatarKey'> & {
  athleteProfile?: AthleteProfile
  trainerProfile?: TrainerProfile
}

export type ProfileApi = {
  getProfile: (signal?: AbortSignal) => Promise<ProfileResponse>
  updateProfile: (request: UpdateProfileRequest) => Promise<ProfileResponse>
  switchRole: (role: ProfileRole) => Promise<ProfileResponse>
}
