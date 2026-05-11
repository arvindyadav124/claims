import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function HomePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Welcome</CardTitle>
          <CardDescription>
            Application shell is ready. Add domain pages under <code className="rounded bg-muted px-1">src/pages</code>{' '}
            or <code className="rounded bg-muted px-1">src/features</code> and register routes in{' '}
            <code className="rounded bg-muted px-1">src/app/router.tsx</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use React Query for server state, React Hook Form for forms, and the shared <code className="rounded bg-muted px-1">api</code>{' '}
          client for authenticated requests.
        </CardContent>
      </Card>
    </div>
  )
}
