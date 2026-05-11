import { api } from '@/lib/api'

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
}

export async function loginRequest(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', body)
  return data
}

export type RegisterRequest = {
  email: string
  password: string
  password_confirm: string
}

export type RegisterResponse = {
  id: number
  email: string
}

export async function registerRequest(body: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/api/auth/register', body)
  return data
}
