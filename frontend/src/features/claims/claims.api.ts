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

export async function fetchClaim(id: number): Promise<Claim> {
  const { data } = await api.get<Claim>(`/api/claims/${id}`)
  return data
}

export async function transitionClaim(claimId: number, status: number): Promise<Claim> {
  const { data } = await api.post<Claim>(`/api/claims/${claimId}/transition`, { status })
  return data
}

export async function transitionClaimLineItem(lineItemId: number, status: number): Promise<void> {
  await api.post(`/api/claims/line-items/${lineItemId}/transition`, { status })
}

export async function submitClaimForAutoApproval(claimId: number): Promise<Claim> {
  const { data } = await api.post<Claim>(`/api/claims/${claimId}/submit-for-auto-approval`, {})
  return data
}
