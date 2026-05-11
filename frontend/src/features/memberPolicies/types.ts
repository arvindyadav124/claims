export type MemberPolicy = {
  id: number
  member: number
  member_user_id?: number
  member_display?: string
  policy: number
  policy_name?: string
  purchasing_date: string
  price: string
  valid_up_to: string
  created_at?: string
  updated_at?: string
}

export type MemberPolicyCreatePayload = {
  member: number
  policy: number
  purchasing_date: string
  price: string
  valid_up_to: string
}
