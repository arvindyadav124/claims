import { api } from '@/lib/api'

import type { Policy, PolicyCreatePayload, PolicyItemCreatePayload } from './types'

export async function fetchPolicies(): Promise<Policy[]> {
  const { data } = await api.get<Policy[]>('/api/policies/')
  return Array.isArray(data) ? data : []
}

export async function createPolicy(payload: PolicyCreatePayload): Promise<Policy> {
  const { data } = await api.post<Policy>('/api/policies/', payload)
  return data
}

export async function createPolicyItem(payload: PolicyItemCreatePayload): Promise<void> {
  await api.post('/api/policies/items', payload)
}

export async function deletePolicy(id: number): Promise<void> {
  await api.delete(`/api/policies/${id}`)
}
