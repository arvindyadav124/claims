import { DisputesTable } from '@/features/disputes/DisputesTable'

export function DisputesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Disputes</h1>
      <p className="text-sm text-muted-foreground">
        Disputes are created from a claim’s actions menu. Use the row menu to advance each dispute through its workflow.
      </p>
      <DisputesTable />
    </div>
  )
}
