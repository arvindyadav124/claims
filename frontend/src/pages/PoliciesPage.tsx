import { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddPolicyForm } from '@/features/policies/AddPolicyForm'
import { PoliciesTable } from '@/features/policies/PoliciesTable'

export function PoliciesPage() {
  const [deleteError, setDeleteError] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Policies</h1>
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
          <TabsTrigger value="add">Add Policy</TabsTrigger>
          <TabsTrigger value="list">Policy List</TabsTrigger>
        </TabsList>
        <TabsContent value="add">
          <AddPolicyForm />
        </TabsContent>
        <TabsContent value="list">
          <PoliciesTable onDeleteError={setDeleteError} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
