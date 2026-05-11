import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  )

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-card md:block">
      <div className="flex h-14 items-center border-b px-4 text-sm font-semibold">Insurance</div>
      <nav className="space-y-1 p-3">
        <NavLink to="/" end className={navClass}>
          Home
        </NavLink>
        {/* Add feature routes here as you build pages */}
      </nav>
    </aside>
  )
}
