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
