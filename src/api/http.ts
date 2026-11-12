import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { apiBaseUrl } from './baseUrl'

export const ACCESS_TOKEN_KEY = 'accessToken'
const publicAuthPaths = new Set([
  '/v1/auth/login', '/v1/auth/register',
  '/v1/auth/password/request', '/v1/auth/password/confirm',
  '/v1/auth/email/confirm', '/v1/auth/email/resend',
])

export const api = Axios.create({
  timeout: 15000,
  baseURL: apiBaseUrl,
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
