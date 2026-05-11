import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { getClaimStatusLabel, getLineItemStatusLabel } from '@/features/claims/claimStatusLabels'
import type { Claim } from '@/features/claims/types'

type ClaimViewDialogProps = {
  claim: Claim | null
  onDismiss: () => void
}

export function ClaimViewDialog({ claim, onDismiss }: ClaimViewDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (claim) {
      el.showModal()
    } else {
      el.close()
    }
  }, [claim])

  return (
    <dialog
      ref={ref}
      className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card p-0 text-card-foreground shadow-xl [&::backdrop]:bg-black/50"
      onClose={onDismiss}
    >
      {claim ? (
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{claim.claim_number}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                ID {claim.id} · Policy {claim.policy} · {getClaimStatusLabel(claim.status)}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
              Close
            </Button>
          </div>
          <dl className="mb-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Amount (cents)</dt>
              <dd className="font-medium tabular-nums">{claim.amount_cents}</dd>
            </div>
          </dl>
          <h3 className="mb-2 text-sm font-semibold">Line items</h3>
          {claim.line_items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No line items for this claim.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {claim.line_items.map((it) => (
                    <tr key={it.id} className="border-b last:border-0">
                      <td className="px-3 py-2">{it.diagnosis_code}</td>
                      <td className="px-3 py-2">{it.amount}</td>
                      <td className="px-3 py-2">{getLineItemStatusLabel(it.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </dialog>
  )
}
