import { api } from '@/lib/api'

import type { Dispute } from '@/features/disputes/types'

export async function fetchDisputes(): Promise<Dispute[]> {
  const { data } = await api.get<Dispute[]>('/api/claims/disputes')
  return Array.isArray(data) ? data : []
}

export async function createDispute(payload: { claim: number; reason: string }): Promise<Dispute> {
  const { data } = await api.post<Dispute>('/api/claims/disputes', payload)
  return data
}

export async function transitionDispute(disputeId: number, status: number): Promise<Dispute> {
  const { data } = await api.post<Dispute>(`/api/claims/disputes/${disputeId}/transition`, { status })
  return data
}
