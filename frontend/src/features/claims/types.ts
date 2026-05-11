export type ClaimLineItem = {
  id: number
  diagnosis_code: string
  amount: string
  status: number
  checked_by: number | null
}

export type Claim = {
  id: number
  policy: number
  claim_number: string
  amount_cents: number
  status: number
  line_items: ClaimLineItem[]
  checked_by?: number | null
  created_at?: string
  updated_at?: string
}

export type ClaimCreatePayload = {
  policy: number
  claim_number: string
  amount_cents: number
}

export type ClaimLineItemCreatePayload = {
  claim: number
  diagnosis_code: string
  amount: string
}

export type ClaimLineFormRow = {
  diagnosis_code: string
  amount: string
}

export type ClaimWithLinesFormValues = ClaimCreatePayload & {
  items: ClaimLineFormRow[]
}
