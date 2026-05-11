import { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddClaimForm } from '@/features/claims/AddClaimForm'
import { ClaimsTable } from '@/features/claims/ClaimsTable'

export function ClaimsPage() {
  const [deleteError, setDeleteError] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Claims</h1>
      {deleteError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {deleteError}
        </div>
      ) : null}
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="add">Add claim</TabsTrigger>
          <TabsTrigger value="list">Claim List</TabsTrigger>
        </TabsList>
        <TabsContent value="add">
          <AddClaimForm />
        </TabsContent>
        <TabsContent value="list">
          <ClaimsTable onDeleteError={setDeleteError} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
