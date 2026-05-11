import { createContext, useContext, useId, useMemo, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

type TabsContextValue = {
  value: string
  setValue: (v: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used inside <Tabs>')
  return ctx
}

type TabsProps = {
  defaultValue: string
  className?: string
  children: ReactNode
}

/** Lightweight tab strip + panels (same idea as shadcn Tabs, no extra deps). */
export function Tabs({ defaultValue, className, children }: TabsProps) {
  const [value, setValue] = useState(defaultValue)
  const baseId = useId()
  const memo = useMemo(() => ({ value, setValue, baseId }), [value, baseId])
  return (
    <TabsContext.Provider value={memo}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

type TabsListProps = {
  className?: string
  children: ReactNode
}

export function TabsList({ className, children }: TabsListProps) {
  return (
    <div role="tablist" className={cn('inline-flex h-10 items-center justify-start gap-1 rounded-md bg-muted p-1 text-muted-foreground', className)}>
      {children}
    </div>
  )
}

type TabsTriggerProps = {
  value: string
  className?: string
  children: ReactNode
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps) {
  const { value: active, setValue, baseId } = useTabsContext()
  const selected = active === value
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      id={`${baseId}-tab-${value}`}
      aria-controls={`${baseId}-panel-${value}`}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        selected ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/60 hover:text-foreground',
        className,
      )}
      onClick={() => setValue(value)}
    >
      {children}
    </button>
  )
}

type TabsContentProps = {
  value: string
  className?: string
  children: ReactNode
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const { value: active, baseId } = useTabsContext()
  const hidden = active !== value
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={hidden}
      className={cn('mt-4 focus-visible:outline-none', className)}
      tabIndex={hidden ? -1 : 0}
    >
      {children}
    </div>
  )
}
