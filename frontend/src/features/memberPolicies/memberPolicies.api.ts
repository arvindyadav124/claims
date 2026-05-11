import { api } from '@/lib/api'

import type { MemberPolicy, MemberPolicyCreatePayload } from '@/features/memberPolicies/types'

export async function fetchMemberPolicies(): Promise<MemberPolicy[]> {
  const { data } = await api.get<MemberPolicy[]>('/api/member-policies/')
  return Array.isArray(data) ? data : []
}

/** Purchased policies for the current user with enrollment active as of today. */
export async function fetchMyActiveMemberPolicies(): Promise<MemberPolicy[]> {
  const { data } = await api.get<MemberPolicy[]>('/api/member-policies/', { params: { mine: 1 } })
  return Array.isArray(data) ? data : []
}

export async function createMemberPolicy(payload: MemberPolicyCreatePayload): Promise<MemberPolicy> {
  const { data } = await api.post<MemberPolicy>('/api/member-policies/', payload)
  return data
}

export async function deleteMemberPolicy(id: number): Promise<void> {
  await api.delete(`/api/member-policies/${id}`)
}
