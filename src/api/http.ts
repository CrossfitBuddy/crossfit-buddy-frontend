import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

export const ACCESS_TOKEN_KEY = 'accessToken'
const publicAuthPaths = new Set([
  '/api/v1/auth/login', '/api/v1/auth/register',
  '/api/v1/auth/password/request', '/api/v1/auth/password/confirm',
  '/api/v1/auth/email/confirm', '/api/v1/auth/email/resend',
])

export const api = Axios.create({
  timeout: 15000,
  baseURL: import.meta.env.VITE_API_URL ?? '',
})

api.interceptors.request.use((config) => {
  if (publicAuthPaths.has(config.url ?? '')) {
    delete config.headers.Authorization
    return config
  }
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const customInstance = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
  return api({ ...config, ...options }).then(({ data }) => data)
}

export type ErrorType<Error> = AxiosError<Error>
