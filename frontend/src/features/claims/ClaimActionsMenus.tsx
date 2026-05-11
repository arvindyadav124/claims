import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useClaimViewDialogMenuPortal } from '@/features/claims/claimViewDialogPortalContext'
import { fetchClaim, submitClaimForAutoApproval, transitionClaim, transitionClaimLineItem } from '@/features/claims/claims.api'
import { claimsQueryKey } from '@/features/claims/claims.keys'
import { createDispute } from '@/features/disputes/disputes.api'
import { disputesQueryKey } from '@/features/disputes/disputes.keys'
import { getClaimMenuActions, getLineItemMenuActions, isClaimTerminal } from '@/features/claims/claimStateMachine'
import type { Claim, ClaimLineItem } from '@/features/claims/types'
import { getApiErrorMessage } from '@/lib/api'

const menuContentClass =
  'z-50 min-w-[14rem] overflow-hidden rounded-md border bg-card p-1 text-card-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'

const itemClass =
  'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'

type ClaimActionsMenuProps = {
  claim: Claim
  /** After successful claim transition or dispute */
  onClaimRefresh?: (claim: Claim) => void
  /** Toast / alert for errors */
  onError?: (message: string) => void
}

export function ClaimActionsMenu({ claim, onClaimRefresh, onError }: ClaimActionsMenuProps) {
  const queryClient = useQueryClient()
  const menuPortal = useClaimViewDialogMenuPortal()
  const actions = getClaimMenuActions(claim.status)

  const transitionMut = useMutation({
    mutationFn: (to: number) => transitionClaim(claim.id, to),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: claimsQueryKey })
      onClaimRefresh?.(updated)
    },
    onError: (e) => onError?.(getApiErrorMessage(e)),
  })

  const autoSubmitMut = useMutation({
    mutationFn: () => submitClaimForAutoApproval(claim.id),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: claimsQueryKey })
      onClaimRefresh?.(updated)
    },
    onError: (e) => onError?.(getApiErrorMessage(e)),
  })

  const disputeMut = useMutation({
    mutationFn: (reason: string) => createDispute({ claim: claim.id, reason }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: claimsQueryKey })
      await queryClient.invalidateQueries({ queryKey: disputesQueryKey })
      try {
        const fresh = await fetchClaim(claim.id)
        onClaimRefresh?.(fresh)
      } catch {
        onClaimRefresh?.(claim)
      }
    },
    onError: (e) => onError?.(getApiErrorMessage(e)),
  })

  if (isClaimTerminal(claim.status)) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground" title="No actions">
        —
      </span>
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Claim actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={menuPortal ?? undefined}>
        <DropdownMenu.Content className={menuContentClass} sideOffset={4} align="end">
          {actions.map((a) =>
            a.kind === 'auto_submit' ? (
              <DropdownMenu.Item
                key="auto-submit"
                className={itemClass}
                disabled={transitionMut.isPending || autoSubmitMut.isPending || disputeMut.isPending}
                onSelect={() => {
                  autoSubmitMut.mutate()
                }}
              >
                {a.label}
              </DropdownMenu.Item>
            ) : a.kind === 'transition' ? (
              <DropdownMenu.Item
                key={`t-${a.to}`}
                className={itemClass}
                disabled={transitionMut.isPending || autoSubmitMut.isPending || disputeMut.isPending}
                onSelect={() => {
                  transitionMut.mutate(a.to)
                }}
              >
                {a.label}
              </DropdownMenu.Item>
            ) : a.kind === 'mark_hint' ? (
              <DropdownMenu.Item
                key="mark-hint"
                className={itemClass}
                disabled
                title="Change line item status from the line item menu."
              >
                Mark for manual review
              </DropdownMenu.Item>
            ) : (
              <DropdownMenu.Item
                key="dispute"
                className={itemClass}
                disabled={transitionMut.isPending || autoSubmitMut.isPending || disputeMut.isPending}
                onSelect={() => {
                  const reason = window.prompt('Reason for dispute:', '')
                  if (reason === null) return
                  const trimmed = reason.trim()
                  if (!trimmed) {
                    onError?.('Reason is required to raise a dispute.')
                    return
                  }
                  disputeMut.mutate(trimmed)
                }}
              >
                {a.label}
              </DropdownMenu.Item>
            ),
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

type LineItemActionsMenuProps = {
  lineItem: ClaimLineItem
  claimId: number
  claimStatus: number
  onClaimRefresh?: (claim: Claim) => void
  onError?: (message: string) => void
}

export function LineItemActionsMenu({
  lineItem,
  claimId,
  claimStatus,
  onClaimRefresh,
  onError,
}: LineItemActionsMenuProps) {
  const queryClient = useQueryClient()
  const menuPortal = useClaimViewDialogMenuPortal()
  const actions = getLineItemMenuActions(lineItem.status, claimStatus)

  const transitionMut = useMutation({
    mutationFn: (to: number) => transitionClaimLineItem(lineItem.id, to),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: claimsQueryKey })
      try {
        const fresh = await fetchClaim(claimId)
        onClaimRefresh?.(fresh)
      } catch (e) {
        onError?.(getApiErrorMessage(e, 'Updated but failed to refresh claim.'))
      }
    },
    onError: (e) => onError?.(getApiErrorMessage(e)),
  })

  if (actions.length === 0) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground text-xs" title="No actions">
        —
      </span>
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Line item actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={menuPortal ?? undefined}>
        <DropdownMenu.Content className={menuContentClass} sideOffset={4} align="end">
          {actions.map((a) => (
            <DropdownMenu.Item
              key={`${a.to}`}
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
