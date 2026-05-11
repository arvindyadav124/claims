import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { deletePolicy, fetchPolicies } from '@/features/policies/policies.api'
import { policiesQueryKey } from '@/features/policies/policies.keys'
import { PolicyViewDialog } from '@/features/policies/PolicyViewDialog'
import type { Policy } from '@/features/policies/types'
import { getApiErrorMessage } from '@/lib/api'

type PoliciesTableProps = {
  /** Optional banner when delete fails */
  onDeleteError?: (message: string | null) => void
}

export function PoliciesTable({ onDeleteError }: PoliciesTableProps) {
  const queryClient = useQueryClient()
  const [viewing, setViewing] = useState<Policy | null>(null)

  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: policiesQueryKey,
    queryFn: fetchPolicies,
  })

  const remove = useMutation({
    mutationFn: (id: number) => deletePolicy(id),
    onSuccess: async () => {
      onDeleteError?.(null)
      await queryClient.invalidateQueries({ queryKey: policiesQueryKey })
    },
    onError: (err: unknown) => {
      onDeleteError?.(getApiErrorMessage(err, 'Delete failed.'))
    },
  })

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading policies…</p>
  }

  if (isError) {
    return <p className="text-sm text-destructive">{getApiErrorMessage(error, 'Could not load policies.')}</p>
  }

  const rows = data ?? []

  return (
    <div className="space-y-2">
      <PolicyViewDialog policy={viewing} onDismiss={() => setViewing(null)} />
      {isFetching ? <p className="text-xs text-muted-foreground">Refreshing…</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No policies yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Ages</th>
                <th className="px-3 py-2 font-medium">Gender</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Items</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-3 py-2 tabular-nums">{p.id}</td>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">{p.price}</td>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                    {p.min_age}–{p.max_age}
                  </td>
                  <td className="px-3 py-2 capitalize">{p.eligible_gender}</td>
                  <td className="px-3 py-2 capitalize">{p.status}</td>
                  <td className="px-3 py-2 tabular-nums">{p.items?.length ?? 0}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setViewing(p)}>
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
                              `Delete policy “${p.name}” (ID ${p.id})? This cannot be undone. References from claims or member policies may block deletion.`,
                            )
                          ) {
                            return
                          }
                          remove.mutate(p.id)
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
