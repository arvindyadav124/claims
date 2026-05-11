import { createContext, useContext } from 'react'

/** When set, Radix dropdowns should portal here so they stay above native `<dialog>` top layer. */
export const ClaimViewDialogMenuPortalContext = createContext<HTMLElement | null>(null)

export function useClaimViewDialogMenuPortal(): HTMLElement | null {
  return useContext(ClaimViewDialogMenuPortalContext)
}
