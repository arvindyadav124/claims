import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddClaimForm } from '@/features/claims/AddClaimForm'
import { ClaimsTable } from '@/features/claims/ClaimsTable'

export function ClaimsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Claims</h1>
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="add">Add claim</TabsTrigger>
          <TabsTrigger value="list">Claim List</TabsTrigger>
        </TabsList>
        <TabsContent value="add">
          <AddClaimForm />
        </TabsContent>
        <TabsContent value="list">
          <ClaimsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
