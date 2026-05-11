import { DisputeState } from '@/features/disputes/disputeStateMachine'

const LABELS: Record<number, string> = {
  [DisputeState.DRAFT]: 'Draft',
  [DisputeState.SUBMITTED]: 'Submitted',
  [DisputeState.IN_REVIEW]: 'In review',
  [DisputeState.RESOLVED]: 'Resolved',
}

export function getDisputeStatusLabel(status: number): string {
  return LABELS[status] ?? `Status ${status}`
}
