import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { DisputeActionsMenu } from '@/features/disputes/DisputeActionsMenu'
import { getDisputeStatusLabel } from '@/features/disputes/disputeStatusLabels'
import { fetchDisputes } from '@/features/disputes/disputes.api'
import { disputesQueryKey } from '@/features/disputes/disputes.keys'
import type { Dispute } from '@/features/disputes/types'
import { getApiErrorMessage } from '@/lib/api'

function formatDt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export function DisputesTable() {
  const [rowError, setRowError] = useState<string | null>(null)

  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: disputesQueryKey,
    queryFn: fetchDisputes,
  })

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading disputes…</p>
  }

  if (isError) {
    return <p className="text-sm text-destructive">{getApiErrorMessage(error, 'Could not load disputes.')}</p>
  }

  const rows = data ?? []

  return (
    <div className="space-y-2">
      {rowError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {rowError}
        </div>
      ) : null}
      {isFetching ? <p className="text-xs text-muted-foreground">Refreshing…</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No disputes yet. Raise one from the claim actions menu (three dots) on the Claims page.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Claim</th>
                <th className="px-3 py-2 font-medium">Reason</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="w-12 px-3 py-2 text-right font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d: Dispute) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="px-3 py-2 tabular-nums">{d.id}</td>
                  <td className="px-3 py-2">
                    <span className="font-medium">{d.claim_number ?? '—'}</span>
                    <span className="text-muted-foreground"> · #{d.claim}</span>
                  </td>
                  <td className="max-w-[280px] px-3 py-2">
                    <span className="line-clamp-2" title={d.reason}>
                      {d.reason}
                    </span>
                  </td>
                  <td className="px-3 py-2">{getDisputeStatusLabel(d.status)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDt(d.created_at)}</td>
                  <td className="px-3 py-2 text-right">
                    <DisputeActionsMenu
                      dispute={d}
                      onDisputeUpdated={() => setRowError(null)}
                      onError={(msg) => setRowError(msg)}
                    />
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
