/**
 * Mirrors backend `apps.claims.state_machine` — keep in sync with CLAIM_TRANSITIONS / LINE_ITEM_TRANSITIONS.
 */

export const ClaimState = {
  DRAFT: 1,
  SUBMITTED: 2,
  IN_REVIEW: 3,
  PARTIALLY_APPROVED: 4,
  APPROVED: 5,
  DENIED: 6,
  PAID: 7,
} as const

export const LineItemState = {
  PENDING: 1,
  APPROVED: 2,
  DENIED: 3,
  MANUAL_REVIEW: 4,
} as const

const CLAIM_NEXT: Record<number, ReadonlySet<number>> = {
  [ClaimState.DRAFT]: new Set([ClaimState.SUBMITTED]),
  [ClaimState.SUBMITTED]: new Set([ClaimState.IN_REVIEW]),
  [ClaimState.IN_REVIEW]: new Set([
    ClaimState.PARTIALLY_APPROVED,
    ClaimState.APPROVED,
    ClaimState.DENIED,
  ]),
  [ClaimState.PARTIALLY_APPROVED]: new Set([ClaimState.APPROVED, ClaimState.DENIED]),
  [ClaimState.APPROVED]: new Set([ClaimState.PAID]),
  [ClaimState.DENIED]: new Set(),
  [ClaimState.PAID]: new Set(),
}

const LINE_NEXT: Record<number, ReadonlySet<number>> = {
  [LineItemState.PENDING]: new Set([LineItemState.APPROVED, LineItemState.DENIED, LineItemState.MANUAL_REVIEW]),
  [LineItemState.MANUAL_REVIEW]: new Set([LineItemState.APPROVED, LineItemState.DENIED]),
  [LineItemState.APPROVED]: new Set(),
  [LineItemState.DENIED]: new Set(),
}

export function isClaimTerminal(status: number): boolean {
  return status === ClaimState.DENIED || status === ClaimState.PAID
}

export function isLineItemTerminal(status: number): boolean {
  return status === LineItemState.APPROVED || status === LineItemState.DENIED
}

export function canTransitionClaim(from: number, to: number): boolean {
  return CLAIM_NEXT[from]?.has(to) ?? false
}

export function canTransitionLineItem(from: number, to: number): boolean {
  return LINE_NEXT[from]?.has(to) ?? false
}

export type ClaimMenuAction =
  | { kind: 'transition'; to: number; label: string }
  | { kind: 'auto_submit'; label: string }
  | { kind: 'mark_hint' }
  | { kind: 'dispute'; label: string }

/** Ordered menu for claim header. "Mark for manual review" is line-item only (shown disabled). */
export function getClaimMenuActions(status: number): ClaimMenuAction[] {
  if (isClaimTerminal(status)) return []

  const actions: ClaimMenuAction[] = []

  if (canTransitionClaim(status, ClaimState.SUBMITTED)) {
    actions.push({ kind: 'auto_submit', label: 'Submit for auto-approval' })
  }
  if (canTransitionClaim(status, ClaimState.IN_REVIEW)) {
    actions.push({ kind: 'transition', to: ClaimState.IN_REVIEW, label: 'Start review' })
  }

  actions.push({ kind: 'mark_hint' })

  if (canTransitionClaim(status, ClaimState.APPROVED)) {
    actions.push({ kind: 'transition', to: ClaimState.APPROVED, label: 'Approve' })
  }
  if (canTransitionClaim(status, ClaimState.DENIED)) {
    actions.push({ kind: 'transition', to: ClaimState.DENIED, label: 'Deny' })
  }
  if (canTransitionClaim(status, ClaimState.PAID)) {
    actions.push({ kind: 'transition', to: ClaimState.PAID, label: 'Paid' })
  }

  actions.push({ kind: 'dispute', label: 'Raise a dispute' })

  return actions
}

export type LineItemMenuAction = { kind: 'transition'; to: number; label: string }

export function getLineItemMenuActions(lineStatus: number, claimStatus: number): LineItemMenuAction[] {
  if (claimStatus === ClaimState.PAID) return []
  if (isLineItemTerminal(lineStatus)) return []

  const actions: LineItemMenuAction[] = []

  if (canTransitionLineItem(lineStatus, LineItemState.APPROVED)) {
    actions.push({ kind: 'transition', to: LineItemState.APPROVED, label: 'Approve' })
  }
  if (canTransitionLineItem(lineStatus, LineItemState.DENIED)) {
    actions.push({ kind: 'transition', to: LineItemState.DENIED, label: 'Deny' })
  }
  if (canTransitionLineItem(lineStatus, LineItemState.MANUAL_REVIEW)) {
    actions.push({ kind: 'transition', to: LineItemState.MANUAL_REVIEW, label: 'Mark for manual review' })
  }

  return actions
}
