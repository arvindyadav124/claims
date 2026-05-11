import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import type { Policy } from '@/features/policies/types'

type PolicyViewDialogProps = {
  policy: Policy | null
  onDismiss: () => void
}

export function PolicyViewDialog({ policy, onDismiss }: PolicyViewDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (policy) {
      el.showModal()
    } else {
      el.close()
    }
  }, [policy])

  return (
    <dialog
      ref={ref}
      className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card p-0 text-card-foreground shadow-xl [&::backdrop]:bg-black/50"
      onClose={onDismiss}
    >
      {policy ? (
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{policy.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                ID {policy.id} · {policy.status} · {policy.eligible_gender}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
              Close
            </Button>
          </div>
          <dl className="mb-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Price</dt>
              <dd className="font-medium">{policy.price}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Min age</dt>
              <dd className="font-medium">{policy.min_age}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Max age</dt>
              <dd className="font-medium">{policy.max_age}</dd>
            </div>
          </dl>
          <h3 className="mb-2 text-sm font-semibold">Line items</h3>
          {policy.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No line items for this policy.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Max %</th>
                    <th className="px-3 py-2 font-medium">Yearly limit</th>
                    <th className="px-3 py-2 font-medium">Claims / yr</th>
                  </tr>
                </thead>
                <tbody>
                  {policy.items.map((it) => (
                    <tr key={it.id} className="border-b last:border-0">
                      <td className="px-3 py-2">{it.diagnosis_code}</td>
                      <td className="px-3 py-2 tabular-nums">{it.max_percent_of_policy}</td>
                      <td className="px-3 py-2">{it.max_yearly_limit}</td>
                      <td className="px-3 py-2 tabular-nums">{it.max_claims_per_year}</td>
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
