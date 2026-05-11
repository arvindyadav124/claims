import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/routes/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { ClaimsPage } from '@/pages/ClaimsPage'
import { MembersPage } from '@/pages/MembersPage'
import { PoliciesPage } from '@/pages/PoliciesPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'policies', element: <PoliciesPage /> },
          { path: 'claims', element: <ClaimsPage /> },
          { path: 'members', element: <MembersPage /> },
          { path: 'disputes', element: <PlaceholderPage title="Disputes" /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
