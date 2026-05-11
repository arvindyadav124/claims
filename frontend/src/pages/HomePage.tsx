import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClaimState } from '@/features/claims/claimStateMachine'
import { getClaimStatusLabel } from '@/features/claims/claimStatusLabels'
import { fetchClaims } from '@/features/claims/claims.api'
import { claimsQueryKey } from '@/features/claims/claims.keys'
import { getDisputeStatusLabel } from '@/features/disputes/disputeStatusLabels'
import { fetchDisputes } from '@/features/disputes/disputes.api'
import { disputesQueryKey } from '@/features/disputes/disputes.keys'
import { aggregateByStatus } from '@/features/home/aggregateByStatus'
import { fetchMemberPolicies } from '@/features/memberPolicies/memberPolicies.api'
import { memberPoliciesQueryKey } from '@/features/memberPolicies/memberPolicies.keys'
import { fetchMembers } from '@/features/members/members.api'
import { membersQueryKey } from '@/features/members/members.keys'
import { getApiErrorMessage } from '@/lib/api'

function StatusBreakdownList({
  rows,
  emptyLabel,
}: {
  rows: { status: number; count: number; label: string }[]
  emptyLabel: string
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }
  return (
    <ul className="divide-y rounded-md border">
      {rows.map((row) => (
        <li key={row.status} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{row.label}</span>
          <span className="tabular-nums font-medium">{row.count}</span>
        </li>
      ))}
    </ul>
  )
}

export function HomePage() {
  const claimsQuery = useQuery({ queryKey: claimsQueryKey, queryFn: fetchClaims })
  const membersQuery = useQuery({ queryKey: membersQueryKey, queryFn: fetchMembers })
  const purchasesQuery = useQuery({ queryKey: memberPoliciesQueryKey, queryFn: fetchMemberPolicies })
  const disputesQuery = useQuery({ queryKey: disputesQueryKey, queryFn: fetchDisputes })

  const loading =
    claimsQuery.isPending || membersQuery.isPending || purchasesQuery.isPending || disputesQuery.isPending

  const error =
    claimsQuery.error ?? membersQuery.error ?? purchasesQuery.error ?? disputesQuery.error ?? null

  const claims = claimsQuery.data ?? []
  const members = membersQuery.data ?? []
  const purchases = purchasesQuery.data ?? []
  const disputes = disputesQuery.data ?? []

  const claimsInProgress = useMemo(
    () => claims.filter((c) => c.status !== ClaimState.DENIED && c.status !== ClaimState.PAID).length,
    [claims],
  )

  const claimRows = useMemo(
    () => aggregateByStatus(claims, getClaimStatusLabel),
    [claims],
  )

  const disputeRows = useMemo(
    () => aggregateByStatus(disputes, getDisputeStatusLabel),
    [disputes],
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-destructive">{getApiErrorMessage(error, 'Could not load dashboard data.')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Snapshot of members, enrollments, claims, and disputes.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Members</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{members.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Profiles in the system</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Policy purchases</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{purchases.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Member policy enrollments (all time)</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Claims in progress</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{claimsInProgress}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Not denied or paid ({claims.length} total)</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Disputes</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{disputes.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">All dispute records</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Claims by stage</CardTitle>
            <CardDescription>Count per claim workflow state</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusBreakdownList rows={claimRows} emptyLabel="No claims yet." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Disputes by stage</CardTitle>
            <CardDescription>Count per dispute workflow state</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusBreakdownList rows={disputeRows} emptyLabel="No disputes yet." />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
