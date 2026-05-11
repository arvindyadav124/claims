export type Dispute = {
  id: number
  claim: number
  claim_number: string
  reason: string
  status: number
  checked_by: number | null
  created_by: number | null
  updated_by: number | null
  created_at: string
  updated_at: string
}
