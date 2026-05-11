/**
 * Mirrors backend `apps.claims.state_machine` DISPUTE_TRANSITIONS.
 * DRAFT → SUBMITTED → IN_REVIEW → RESOLVED.
 */

export const DisputeState = {
  DRAFT: 1,
  SUBMITTED: 2,
  IN_REVIEW: 3,
  RESOLVED: 4,
} as const

const DISPUTE_NEXT: Record<number, ReadonlySet<number>> = {
  [DisputeState.DRAFT]: new Set([DisputeState.SUBMITTED]),
  [DisputeState.SUBMITTED]: new Set([DisputeState.IN_REVIEW]),
  [DisputeState.IN_REVIEW]: new Set([DisputeState.RESOLVED]),
  [DisputeState.RESOLVED]: new Set(),
}

export function isDisputeTerminal(status: number): boolean {
  return status === DisputeState.RESOLVED
}

export function canTransitionDispute(from: number, to: number): boolean {
  return DISPUTE_NEXT[from]?.has(to) ?? false
}

const TO_LABEL: Record<number, string> = {
  [DisputeState.SUBMITTED]: 'Submit',
  [DisputeState.IN_REVIEW]: 'Start review',
  [DisputeState.RESOLVED]: 'Mark resolved',
}

export type DisputeMenuAction = { kind: 'transition'; to: number; label: string }

export function getDisputeMenuActions(status: number): DisputeMenuAction[] {
  if (isDisputeTerminal(status)) return []
  const actions: DisputeMenuAction[] = []
  for (const to of DISPUTE_NEXT[status] ?? []) {
    const label = TO_LABEL[to]
    if (label) actions.push({ kind: 'transition', to, label })
  }
  return actions
}
