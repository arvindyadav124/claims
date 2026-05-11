import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { ClaimActionsMenu } from '@/features/claims/ClaimActionsMenus'
import { getClaimStatusLabel } from '@/features/claims/claimStatusLabels'
import { ClaimViewDialog } from '@/features/claims/ClaimViewDialog'
import { fetchClaims } from '@/features/claims/claims.api'
import { claimsQueryKey } from '@/features/claims/claims.keys'
import type { Claim } from '@/features/claims/types'
import { getApiErrorMessage } from '@/lib/api'

export function ClaimsTable() {
  const [viewing, setViewing] = useState<Claim | null>(null)
  const [claimActionError, setClaimActionError] = useState<string | null>(null)

  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: claimsQueryKey,
    queryFn: fetchClaims,
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
      <ClaimViewDialog
        claim={viewing}
        onDismiss={() => setViewing(null)}
        onClaimUpdated={(c) => {
          setClaimActionError(null)
          setViewing(c)
        }}
        onActionError={setClaimActionError}
      />
      {claimActionError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {claimActionError}
        </div>
      ) : null}
      {isFetching ? <p className="text-xs text-muted-foreground">Refreshing…</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No claims yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[720px] text-left text-sm">
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
                    <div className="flex justify-end items-center gap-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => setViewing(c)}>
                        View
                      </Button>
                      <ClaimActionsMenu
                        claim={c}
                        onClaimRefresh={(updated) => {
                          setClaimActionError(null)
                          if (viewing?.id === updated.id) {
                            setViewing(updated)
                          }
                        }}
                        onError={(msg) => setClaimActionError(msg)}
                      />
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
