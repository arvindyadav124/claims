import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddMemberForm } from '@/features/members/AddMemberForm'
import { MembersTable } from '@/features/members/MembersTable'

export function MembersPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="add">Add Member</TabsTrigger>
          <TabsTrigger value="list">Members List</TabsTrigger>
        </TabsList>
        <TabsContent value="add">
          <AddMemberForm />
        </TabsContent>
        <TabsContent value="list">
          <MembersTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
