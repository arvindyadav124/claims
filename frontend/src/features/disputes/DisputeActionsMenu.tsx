import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getDisputeMenuActions, isDisputeTerminal } from '@/features/disputes/disputeStateMachine'
import { transitionDispute } from '@/features/disputes/disputes.api'
import { disputesQueryKey } from '@/features/disputes/disputes.keys'
import type { Dispute } from '@/features/disputes/types'
import { getApiErrorMessage } from '@/lib/api'

const menuContentClass =
  'z-50 min-w-[14rem] overflow-hidden rounded-md border bg-card p-1 text-card-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'

const itemClass =
  'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'

type DisputeActionsMenuProps = {
  dispute: Dispute
  onDisputeUpdated?: (d: Dispute) => void
  onError?: (message: string) => void
}

export function DisputeActionsMenu({ dispute, onDisputeUpdated, onError }: DisputeActionsMenuProps) {
  const queryClient = useQueryClient()
  const actions = getDisputeMenuActions(dispute.status)

  const transitionMut = useMutation({
    mutationFn: (to: number) => transitionDispute(dispute.id, to),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: disputesQueryKey })
      onDisputeUpdated?.(updated)
    },
    onError: (e: unknown) => onError?.(getApiErrorMessage(e)),
  })

  if (isDisputeTerminal(dispute.status) || actions.length === 0) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground text-xs" title="No actions">
        —
      </span>
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Dispute actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={menuContentClass} sideOffset={4} align="end">
          {actions.map((a) => (
            <DropdownMenu.Item
              key={a.to}
              className={itemClass}
              disabled={transitionMut.isPending}
              onSelect={() => {
                transitionMut.mutate(a.to)
              }}
            >
              {a.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
