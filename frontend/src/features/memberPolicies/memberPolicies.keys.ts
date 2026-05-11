export const memberPoliciesQueryKey = ['member-policies'] as const

/** Active enrollments for the authenticated member (claim form, etc.). */
export const memberPoliciesMineQueryKey = [...memberPoliciesQueryKey, 'mine'] as const
