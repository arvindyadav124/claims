import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddMemberPolicyForm } from '@/features/memberPolicies/AddMemberPolicyForm'
import { MemberPoliciesTable } from '@/features/memberPolicies/MemberPoliciesTable'

export function MemberPoliciesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Purchase policy</h1>
      <Tabs defaultValue="purchase">
        <TabsList>
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
          <TabsTrigger value="list">Member policies</TabsTrigger>
        </TabsList>
        <TabsContent value="purchase">
          <AddMemberPolicyForm />
        </TabsContent>
        <TabsContent value="list">
          <MemberPoliciesTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
