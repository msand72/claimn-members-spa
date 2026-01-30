import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { LoadingSpinner } from './components/LoadingSpinner'

// Pages - Auth
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))

// Pages - Core
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const BillingPage = lazy(() => import('./pages/BillingPage'))
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'))

// Pages - Community
const FeedPage = lazy(() => import('./pages/FeedPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))
const ConnectionsPage = lazy(() => import('./pages/ConnectionsPage'))
const CirclesPage = lazy(() => import('./pages/CirclesPage'))
const CircleDetailPage = lazy(() => import('./pages/CircleDetailPage'))
const NetworkPage = lazy(() => import('./pages/NetworkPage'))

// Pages - Shop & Experts
const ShopPage = lazy(() => import('./pages/ShopPage'))
const ShopProtocolsPage = lazy(() => import('./pages/ShopProtocolsPage'))
const ShopProtocolDetailPage = lazy(() => import('./pages/ShopProtocolDetailPage'))
const ShopCirclesPage = lazy(() => import('./pages/ShopCirclesPage'))
const ShopUpgradePage = lazy(() => import('./pages/ShopUpgradePage'))
const ShopSuccessPage = lazy(() => import('./pages/ShopSuccessPage'))
const BookSessionPage = lazy(() => import('./pages/BookSessionPage'))
const ExpertsPage = lazy(() => import('./pages/ExpertsPage'))
const ExpertSessionsPage = lazy(() => import('./pages/ExpertSessionsPage'))
const ExpertProfilePage = lazy(() => import('./pages/ExpertProfilePage'))
const ProgramsPage = lazy(() => import('./pages/ProgramsPage'))
const ProgramsSprintsPage = lazy(() => import('./pages/ProgramsSprintsPage'))
const ProgramsReviewsPage = lazy(() => import('./pages/ProgramsReviewsPage'))

// Pages - Coaching
const CoachingSessionsPage = lazy(() => import('./pages/CoachingSessionsPage'))
const CoachingResourcesPage = lazy(() => import('./pages/CoachingResourcesPage'))
const SessionNotesPage = lazy(() => import('./pages/SessionNotesPage'))

// Pages - Transformation Tracking
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'))
const AssessmentTakePage = lazy(() => import('./pages/AssessmentTakePage'))
const AssessmentResultsPage = lazy(() => import('./pages/AssessmentResultsPage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const GoalDetailPage = lazy(() => import('./pages/GoalDetailPage'))
const ActionItemsPage = lazy(() => import('./pages/ActionItemsPage'))
const ProtocolsPage = lazy(() => import('./pages/ProtocolsPage'))
const ProtocolDetailPage = lazy(() => import('./pages/ProtocolDetailPage'))
const InterestGroupsPage = lazy(() => import('./pages/InterestGroupsPage'))
const KPIsPage = lazy(() => import('./pages/KPIsPage'))
const MilestonesPage = lazy(() => import('./pages/MilestonesPage'))
const AccountabilityPage = lazy(() => import('./pages/AccountabilityPage'))


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx client errors (404, 403, 401, etc.)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status
          if (status >= 400 && status < 500) return false
        }
        return failureCount < 1
      },
    },
  },
})

function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

function SuspenseLayout() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Outlet />
    </Suspense>
  )
}

const router = createBrowserRouter([
  {
    element: <SuspenseLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Public routes - Auth
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },

      // Protected routes - Core Pages
      { path: '/', element: <Protected><DashboardPage /></Protected> },
      { path: '/profile', element: <Protected><ProfilePage /></Protected> },
      { path: '/billing', element: <Protected><BillingPage /></Protected> },
      { path: '/resources', element: <Protected><ResourcesPage /></Protected> },

      // Protected routes - Community Pages
      { path: '/feed', element: <Protected><FeedPage /></Protected> },
      { path: '/messages', element: <Protected><MessagesPage /></Protected> },
      { path: '/connections', element: <Protected><ConnectionsPage /></Protected> },
      { path: '/circles', element: <Protected><CirclesPage /></Protected> },
      { path: '/circles/:id', element: <Protected><CircleDetailPage /></Protected> },
      { path: '/network', element: <Protected><NetworkPage /></Protected> },

      // Protected routes - Shop & Experts
      { path: '/shop', element: <Protected><ShopPage /></Protected> },
      { path: '/book-session', element: <Protected><BookSessionPage /></Protected> },
      { path: '/experts', element: <Protected><ExpertsPage /></Protected> },
      { path: '/experts/:id', element: <Protected><ExpertProfilePage /></Protected> },
      { path: '/programs', element: <Protected><ProgramsPage /></Protected> },
      { path: '/programs/sprints', element: <Protected><ProgramsSprintsPage /></Protected> },
      { path: '/programs/reviews', element: <Protected><ProgramsReviewsPage /></Protected> },

      // Protected routes - Coaching
      { path: '/coaching/sessions', element: <Protected><CoachingSessionsPage /></Protected> },
      { path: '/coaching/resources', element: <Protected><CoachingResourcesPage /></Protected> },
      { path: '/coaching/session-notes', element: <Protected><SessionNotesPage /></Protected> },

      // Protected routes - Expert Sessions
      { path: '/expert-sessions', element: <Protected><ExpertSessionsPage /></Protected> },

      // Protected routes - Transformation Tracking
      { path: '/assessment', element: <Protected><AssessmentPage /></Protected> },
      { path: '/assessment/take', element: <Protected><AssessmentTakePage /></Protected> },
      { path: '/assessment/results', element: <Protected><AssessmentResultsPage /></Protected> },
      { path: '/goals', element: <Protected><GoalsPage /></Protected> },
      { path: '/goals/:id', element: <Protected><GoalDetailPage /></Protected> },
      { path: '/action-items', element: <Protected><ActionItemsPage /></Protected> },
      { path: '/protocols', element: <Protected><ProtocolsPage /></Protected> },
      { path: '/protocols/:slug', element: <Protected><ProtocolDetailPage /></Protected> },
      { path: '/interest-groups', element: <Protected><InterestGroupsPage /></Protected> },
      { path: '/kpis', element: <Protected><KPIsPage /></Protected> },
      { path: '/milestones', element: <Protected><MilestonesPage /></Protected> },
      { path: '/accountability', element: <Protected><AccountabilityPage /></Protected> },

      // Protected routes - Shop
      { path: '/shop/protocols', element: <Protected><ShopProtocolsPage /></Protected> },
      { path: '/shop/protocols/:slug', element: <Protected><ShopProtocolDetailPage /></Protected> },
      { path: '/shop/circles', element: <Protected><ShopCirclesPage /></Protected> },
      { path: '/shop/upgrade', element: <Protected><ShopUpgradePage /></Protected> },
      { path: '/shop/success', element: <Protected><ShopSuccessPage /></Protected> },

      // 404 fallback — handled by errorElement (RouteErrorBoundary)
      { path: '*', element: <RouteErrorBoundary /> },
    ],
  },
])

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
