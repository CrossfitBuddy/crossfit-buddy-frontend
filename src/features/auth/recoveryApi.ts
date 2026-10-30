import { api } from '../../api/http'
import { isAxiosError } from 'axios'
import { AuthError } from './authApi'
import type { RecoveryApi } from './recoveryContext'

const errorCodes: Record<string, string> = {
  INVALID_RESET_CODE: 'INVALID_CODE',
  RESET_CODE_EXPIRED: 'CODE_EXPIRED',
  RESET_ATTEMPTS_EXCEEDED: 'TOO_MANY_ATTEMPTS',
  PASSWORD_MISMATCH: 'PASSWORD_MISMATCH',
  PASSWORD_TOO_LONG: 'PASSWORD_TOO_LONG',
}

async function request(operation: () => Promise<unknown>) {
  try { await operation() } catch (error) {
    if (!isAxiosError(error)) throw new AuthError('SERVER_ERROR')
    const code: unknown = error.response?.data?.code
    if (typeof code === 'string' && errorCodes[code]) throw new AuthError(errorCodes[code])
    if (code === 'VALIDATION_ERROR') throw new AuthError('VALIDATION_ERROR')
    if (error.response?.status === 429) throw new AuthError('TOO_MANY_REQUESTS')
    throw new AuthError(error.response ? 'SERVER_ERROR' : 'NETWORK_ERROR')
  }
}

export const recoveryApi: RecoveryApi = {
  requestCode: (email) => request(() => api.post('/api/v1/auth/password/request', { email: email.trim() })),
  resetPassword: (values) => request(() => api.post('/api/v1/auth/password/confirm', values)),
}
