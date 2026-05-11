import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { deleteMemberPolicy, fetchMemberPolicies } from '@/features/memberPolicies/memberPolicies.api'
import { memberPoliciesQueryKey } from '@/features/memberPolicies/memberPolicies.keys'
import type { MemberPolicy } from '@/features/memberPolicies/types'
import { getApiErrorMessage } from '@/lib/api'

export function MemberPoliciesTable() {
  const queryClient = useQueryClient()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: memberPoliciesQueryKey,
    queryFn: fetchMemberPolicies,
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteMemberPolicy(id),
    onSuccess: async () => {
      setDeleteError(null)
      await queryClient.invalidateQueries({ queryKey: memberPoliciesQueryKey })
    },
    onError: (err: unknown) => {
      setDeleteError(getApiErrorMessage(err, 'Delete failed.'))
    },
  })

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading enrollments…</p>
  }

  if (isError) {
    return <p className="text-sm text-destructive">{getApiErrorMessage(error, 'Could not load member policies.')}</p>
  }

  const rows = data ?? []

  return (
    <div className="space-y-2">
      {deleteError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {deleteError}
        </div>
      ) : null}
      {isFetching ? <p className="text-xs text-muted-foreground">Refreshing…</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No policy enrollments yet. Use the Purchase tab to add one.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Member</th>
                <th className="px-3 py-2 font-medium">Policy</th>
                <th className="px-3 py-2 font-medium">Purchased</th>
                <th className="px-3 py-2 font-medium">Valid to</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: MemberPolicy) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2 tabular-nums">{r.id}</td>
                  <td className="px-3 py-2 tabular-nums">{r.member_user_id ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className="text-muted-foreground">#{r.member}</span>
                    {r.member_display ? (
                      <span className="ml-1 text-foreground" title={r.member_display}>
                        {r.member_display}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium">{r.policy_name ?? `Policy #${r.policy}`}</span>
                    <span className="text-muted-foreground"> · #{r.policy}</span>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">{r.purchasing_date}</td>
                  <td className="px-3 py-2 tabular-nums">{r.valid_up_to}</td>
                  <td className="px-3 py-2 tabular-nums">{r.price}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={remove.isPending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Remove enrollment ID ${r.id} (member #${r.member}, policy #${r.policy})? This cannot be undone.`,
                          )
                        ) {
                          return
                        }
                        remove.mutate(r.id)
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
