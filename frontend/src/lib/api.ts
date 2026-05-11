import axios, { type AxiosError, isAxiosError } from 'axios'

import { clearStoredToken, getStoredToken } from '@/features/auth/tokenStorage'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const url = String(error.config?.url ?? '')
      if (!url.includes('/auth/login')) {
        clearStoredToken()
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign('/login')
        }
      }
    }
    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | string | undefined
    if (typeof data === 'string' && data.trim()) return data
    if (data && typeof data === 'object') {
      const detail = data.detail
      if (typeof detail === 'string') return detail
      const nonField = data.non_field_errors
      if (Array.isArray(nonField) && typeof nonField[0] === 'string') return nonField[0]
    }
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

/** First string message per field from DRF validation payloads. */
export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError(error)) return {}
  const raw = error.response?.data
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
      out[key] = val[0]
    } else if (typeof val === 'string') {
      out[key] = val
    }
  }
  return out
}
