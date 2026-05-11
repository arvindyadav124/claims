type PlaceholderPageProps = {
  title: string
}

/** Route shell only — replace with real screens later. */
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
    </div>
  )
}
