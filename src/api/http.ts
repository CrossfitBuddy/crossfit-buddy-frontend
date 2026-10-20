import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

export const ACCESS_TOKEN_KEY = 'accessToken'

export const api = Axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
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
