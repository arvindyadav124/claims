import { api } from '@/lib/api'

import type { Claim, ClaimCreatePayload, ClaimLineItemCreatePayload } from './types'

export async function fetchClaims(): Promise<Claim[]> {
  const { data } = await api.get<Claim[]>('/api/claims/')
  return Array.isArray(data) ? data : []
}

export async function createClaim(payload: ClaimCreatePayload): Promise<Claim> {
  const { data } = await api.post<Claim>('/api/claims/', payload)
  return data
}

export async function createClaimLineItem(payload: ClaimLineItemCreatePayload): Promise<void> {
  await api.post('/api/claims/line-items', payload)
}

export async function deleteClaim(id: number): Promise<void> {
  await api.delete(`/api/claims/${id}`)
}
