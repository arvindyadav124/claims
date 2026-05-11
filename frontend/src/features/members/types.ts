/** Member row as returned by GET /api/members/ */
export type Member = {
  id: number
  first_name: string
  last_name: string
  email: string
  user: number
  dob: string
  gender: string
  mobile: string
  address?: string
  distt?: string
  state?: string
  pincode?: string
  created_at?: string
  updated_at?: string
}

export type MemberCreatePayload = {
  first_name: string
  last_name: string
  user: number
  dob: string
  gender: string
  mobile: string
  address?: string
  distt?: string
  state?: string
  pincode?: string
}
