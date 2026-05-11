export type PolicyItem = {
  id: number
  diagnosis_code: string
  max_percent_of_policy: number
  max_yearly_limit: string
  max_claims_per_year: number
  created_at?: string
  updated_at?: string
}

export type Policy = {
  id: number
  name: string
  price: string
  min_age: number
  max_age: number
  eligible_gender: string
  total_cover: number
  status: string
  items: PolicyItem[]
  created_at?: string
  updated_at?: string
}

export type PolicyCreatePayload = {
  name: string
  price: string
  min_age: number
  max_age: number
  eligible_gender: string
  total_cover: number
}

export type PolicyItemCreatePayload = {
  policy: number
  diagnosis_code: string
  max_percent_of_policy: number
  max_yearly_limit: string
  max_claims_per_year: number
}

export type PolicyItemLineForm = {
  diagnosis_code: string
  max_percent_of_policy: number
  max_yearly_limit: string
  max_claims_per_year: number
}

export type PolicyWithItemsFormValues = PolicyCreatePayload & {
  items: PolicyItemLineForm[]
}
