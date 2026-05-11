import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { getClaimStatusLabel } from '@/features/claims/claimStatusLabels'
import { ClaimViewDialog } from '@/features/claims/ClaimViewDialog'
import { deleteClaim, fetchClaims } from '@/features/claims/claims.api'
import { claimsQueryKey } from '@/features/claims/claims.keys'
import type { Claim } from '@/features/claims/types'
import { getApiErrorMessage } from '@/lib/api'

type ClaimsTableProps = {
  onDeleteError?: (message: string | null) => void
}

export function ClaimsTable({ onDeleteError }: ClaimsTableProps) {
  const queryClient = useQueryClient()
  const [viewing, setViewing] = useState<Claim | null>(null)

  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: claimsQueryKey,
    queryFn: fetchClaims,
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteClaim(id),
    onSuccess: async () => {
      onDeleteError?.(null)
      await queryClient.invalidateQueries({ queryKey: claimsQueryKey })
    },
    onError: (err: unknown) => {
      onDeleteError?.(getApiErrorMessage(err, 'Delete failed.'))
    },
  })

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading claims…</p>
  }

  if (isError) {
    return <p className="text-sm text-destructive">{getApiErrorMessage(error, 'Could not load claims.')}</p>
  }

  const rows = data ?? []

  return (
    <div className="space-y-2">
      <ClaimViewDialog claim={viewing} onDismiss={() => setViewing(null)} />
      {isFetching ? <p className="text-xs text-muted-foreground">Refreshing…</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No claims yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Claim #</th>
                <th className="px-3 py-2 font-medium">Policy</th>
                <th className="px-3 py-2 font-medium">Amount (¢)</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Lines</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-3 py-2 tabular-nums">{c.id}</td>
                  <td className="px-3 py-2 font-medium">{c.claim_number}</td>
                  <td className="px-3 py-2 tabular-nums">{c.policy}</td>
                  <td className="px-3 py-2 tabular-nums">{c.amount_cents}</td>
                  <td className="px-3 py-2">{getClaimStatusLabel(c.status)}</td>
                  <td className="px-3 py-2 tabular-nums">{c.line_items?.length ?? 0}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setViewing(c)}>
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={remove.isPending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Delete claim “${c.claim_number}” (ID ${c.id})? Line items and related records will be removed where the database allows.`,
                            )
                          ) {
                            return
                          }
                          remove.mutate(c.id)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
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
