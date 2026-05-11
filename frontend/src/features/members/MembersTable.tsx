import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { deleteMember, fetchMembers } from '@/features/members/members.api'
import { membersQueryKey } from '@/features/members/members.keys'
import { getApiErrorMessage } from '@/lib/api'

type MembersTableProps = {
  onDeleteError?: (message: string | null) => void
}

export function MembersTable({ onDeleteError }: MembersTableProps) {
  const queryClient = useQueryClient()

  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: membersQueryKey,
    queryFn: fetchMembers,
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteMember(id),
    onSuccess: async () => {
      onDeleteError?.(null)
      await queryClient.invalidateQueries({ queryKey: membersQueryKey })
    },
    onError: (err: unknown) => {
      onDeleteError?.(getApiErrorMessage(err, 'Delete failed.'))
    },
  })

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading members…</p>
  }

  if (isError) {
    return <p className="text-sm text-destructive">{getApiErrorMessage(error, 'Could not load members.')}</p>
  }

  const rows = data ?? []

  return (
    <div className="space-y-2">
      {isFetching ? <p className="text-xs text-muted-foreground">Refreshing…</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">DOB</th>
                <th className="px-3 py-2 font-medium">Gender</th>
                <th className="px-3 py-2 font-medium">Mobile</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="px-3 py-2 tabular-nums">{m.id}</td>
                  <td className="px-3 py-2">
                    {m.first_name} {m.last_name}
                  </td>
                  <td className="px-3 py-2">{m.email}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{m.dob}</td>
                  <td className="px-3 py-2 uppercase">{m.gender}</td>
                  <td className="px-3 py-2">{m.mobile}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={remove.isPending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Delete member ${m.first_name} ${m.last_name} (${m.email})? Their user account will remain; only the member profile is removed.`,
                          )
                        ) {
                          return
                        }
                        remove.mutate(m.id)
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
