import { api } from '@/lib/api'

import type { Member, MemberCreatePayload } from './types'

export async function fetchMembers(): Promise<Member[]> {
  const { data } = await api.get<Member[]>('/api/members/')
  return Array.isArray(data) ? data : []
}

export async function createMember(payload: MemberCreatePayload): Promise<Member> {
  const { data } = await api.post<Member>('/api/members/', payload)
  return data
}
