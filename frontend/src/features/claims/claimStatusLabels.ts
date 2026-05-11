/** Mirrors `apps.claims.state_machine.ClaimState` (DRF stores int). */
const CLAIM_STATUS_LABELS: Record<number, string> = {
  1: 'Draft',
  2: 'Submitted',
  3: 'In Review',
  4: 'Partially Approved',
  5: 'Approved',
  6: 'Denied',
  7: 'Paid',
}

/** Mirrors `apps.claims.state_machine.ClaimLineItemState`. */
const LINE_ITEM_STATUS_LABELS: Record<number, string> = {
  1: 'Pending',
  2: 'Approved',
  3: 'Denied',
  4: 'Manual Review',
}

export function getClaimStatusLabel(status: number): string {
  return CLAIM_STATUS_LABELS[status] ?? `Unknown (${status})`
}

export function getLineItemStatusLabel(status: number): string {
  return LINE_ITEM_STATUS_LABELS[status] ?? `Unknown (${status})`
}
