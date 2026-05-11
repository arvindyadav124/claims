import { LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { clearStoredToken } from '@/features/auth/tokenStorage'

export function TopNav() {
  const navigate = useNavigate()

  function handleLogout() {
    clearStoredToken()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" type="button" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Operations console</span>
      </div>
      <Button variant="outline" size="sm" type="button" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Log out
      </Button>
    </header>
  )
}
