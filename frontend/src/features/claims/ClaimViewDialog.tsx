import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ClaimViewDialogMenuPortalContext } from '@/features/claims/claimViewDialogPortalContext'
import { ClaimActionsMenu, LineItemActionsMenu } from '@/features/claims/ClaimActionsMenus'
import { getClaimStatusLabel, getLineItemStatusLabel } from '@/features/claims/claimStatusLabels'
import type { Claim } from '@/features/claims/types'

type ClaimViewDialogProps = {
  claim: Claim | null
  onDismiss: () => void
  /** Called when claim data changes (transition / dispute / line item). */
  onClaimUpdated?: (claim: Claim) => void
  onActionError?: (message: string | null) => void
}

export function ClaimViewDialog({ claim, onDismiss, onClaimUpdated, onActionError }: ClaimViewDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [menuPortalContainer, setMenuPortalContainer] = useState<HTMLElement | null>(null)

  const setDialogRef = (el: HTMLDialogElement | null) => {
    ref.current = el
    setMenuPortalContainer(el)
  }

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
      ref={setDialogRef}
      className="max-h-[90vh] w-full max-w-2xl rounded-lg border bg-card p-0 text-card-foreground shadow-xl [&::backdrop]:bg-black/50"
      onClose={onDismiss}
    >
      <ClaimViewDialogMenuPortalContext.Provider value={menuPortalContainer}>
      {claim ? (
        <div className="max-h-[90vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{claim.claim_number}</h2>
                <ClaimActionsMenu
                  claim={claim}
                  onClaimRefresh={(c) => onClaimUpdated?.(c)}
                  onError={(msg) => onActionError?.(msg)}
                />
              </div>
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
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="w-12 px-3 py-2 text-right font-medium"> </th>
                  </tr>
                </thead>
                <tbody>
                  {claim.line_items.map((it) => (
                    <tr key={it.id} className="border-b last:border-0">
                      <td className="px-3 py-2">{it.diagnosis_code}</td>
                      <td className="px-3 py-2">{it.amount}</td>
                      <td className="px-3 py-2">{getLineItemStatusLabel(it.status)}</td>
                      <td className="px-3 py-2 text-right">
                        <LineItemActionsMenu
                          lineItem={it}
                          claimId={claim.id}
                          claimStatus={claim.status}
                          onClaimRefresh={(c) => onClaimUpdated?.(c)}
                          onError={(msg) => onActionError?.(msg)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
      </ClaimViewDialogMenuPortalContext.Provider>
    </dialog>
  )
}
