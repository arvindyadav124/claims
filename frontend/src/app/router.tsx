import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/routes/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ClaimsPage } from '@/pages/ClaimsPage'
import { MemberPoliciesPage } from '@/pages/MemberPoliciesPage'
import { MembersPage } from '@/pages/MembersPage'
import { PoliciesPage } from '@/pages/PoliciesPage'
import { DisputesPage } from '@/pages/DisputesPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
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
          { path: 'member-policies', element: <MemberPoliciesPage /> },
          { path: 'members', element: <MembersPage /> },
          { path: 'disputes', element: <DisputesPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
