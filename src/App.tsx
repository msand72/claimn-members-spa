import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { BugReportProvider } from './contexts/BugReportContext'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'
import { BugReportPanel } from './components/BugReportPanel'
import { BugReportToast } from './components/BugReportToast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RequireUserType } from './components/RequireUserType'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { PageErrorBoundary } from './components/PageErrorBoundary'
import { LoadingSpinner } from './components/LoadingSpinner'
import { isChunkLoadError } from './lib/isChunkLoadError'

// Auto-reload on stale chunk errors after deploy
function lazyWithRetry(importFn: () => Promise<{ default: ComponentType }>) {
  return lazy(() =>
    importFn().catch((error: unknown) => {
      if (!isChunkLoadError(error)) throw error

      // Prevent infinite reload loop: only reload once per session
      const reloadKey = 'chunk_reload_' + window.location.pathname
      const lastReload = sessionStorage.getItem(reloadKey)
      if (lastReload && Date.now() - Number(lastReload) < 10000) throw error

      sessionStorage.setItem(reloadKey, String(Date.now()))
      window.location.reload()
      // Return a never-resolving promise to prevent React from rendering while reload happens
      return new Promise<never>(() => {})
    })
  )
}

// Pages - Auth
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'))
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'))

// Pages - Core
const HubPage = lazyWithRetry(() => import('./pages/HubPage'))
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'))
const BillingPage = lazyWithRetry(() => import('./pages/BillingPage'))
const ResourcesPage = lazyWithRetry(() => import('./pages/ResourcesPage'))

// Pages - Community
const FeedPage = lazyWithRetry(() => import('./pages/FeedPage'))
const MessagesPage = lazyWithRetry(() => import('./pages/MessagesPage'))
const ConnectionsPage = lazyWithRetry(() => import('./pages/ConnectionsPage'))
const CirclesPage = lazyWithRetry(() => import('./pages/CirclesPage'))
const CircleDetailPage = lazyWithRetry(() => import('./pages/CircleDetailPage'))
const NetworkPage = lazyWithRetry(() => import('./pages/NetworkPage'))

// Pages - Shop & Experts
const ShopPage = lazyWithRetry(() => import('./pages/ShopPage'))
const ShopProtocolsPage = lazyWithRetry(() => import('./pages/ShopProtocolsPage'))
const ShopProtocolDetailPage = lazyWithRetry(() => import('./pages/ShopProtocolDetailPage'))
const ShopCirclesPage = lazyWithRetry(() => import('./pages/ShopCirclesPage'))
const ShopUpgradePage = lazyWithRetry(() => import('./pages/ShopUpgradePage'))
const ShopSuccessPage = lazyWithRetry(() => import('./pages/ShopSuccessPage'))
const BookSessionPage = lazyWithRetry(() => import('./pages/BookSessionPage'))
const ExpertsPage = lazyWithRetry(() => import('./pages/ExpertsPage'))
const ExpertSessionsPage = lazyWithRetry(() => import('./pages/ExpertSessionsPage'))
const ExpertProfilePage = lazyWithRetry(() => import('./pages/ExpertProfilePage'))
const ProgramsPage = lazyWithRetry(() => import('./pages/ProgramsPage'))
const ProgramsSprintsPage = lazyWithRetry(() => import('./pages/ProgramsSprintsPage'))
const ProgramsReviewsPage = lazyWithRetry(() => import('./pages/ProgramsReviewsPage'))

// Pages - Events
const EventsPage = lazyWithRetry(() => import('./pages/EventsPage'))
const EventDetailPage = lazyWithRetry(() => import('./pages/EventDetailPage'))

// Pages - Coaching
const CoachingSessionsPage = lazyWithRetry(() => import('./pages/CoachingSessionsPage'))
const CoachingResourcesPage = lazyWithRetry(() => import('./pages/CoachingResourcesPage'))
const SessionNotesPage = lazyWithRetry(() => import('./pages/SessionNotesPage'))

// Pages - Onboarding
const OnboardingWelcomePage = lazyWithRetry(() => import('./pages/onboarding/OnboardingWelcomePage'))
const OnboardingAssessmentPage = lazyWithRetry(() => import('./pages/onboarding/OnboardingAssessmentPage'))
const OnboardingResultsPage = lazyWithRetry(() => import('./pages/onboarding/OnboardingResultsPage'))
const OnboardingChallengePage = lazyWithRetry(() => import('./pages/onboarding/OnboardingChallengePage'))
const OnboardingPathPage = lazyWithRetry(() => import('./pages/onboarding/OnboardingPathPage'))

// Pages - Notifications
const NotificationsPage = lazyWithRetry(() => import('./pages/NotificationsPage'))

// Pages - Quarterly Reviews
const QuarterlyReviewsPage = lazyWithRetry(() => import('./pages/QuarterlyReviewsPage'))

// Pages - Transformation Tracking
const AssessmentPage = lazyWithRetry(() => import('./pages/AssessmentPage'))
const AssessmentTakePage = lazyWithRetry(() => import('./pages/AssessmentTakePage'))
const AssessmentResultsPage = lazyWithRetry(() => import('./pages/AssessmentResultsPage'))
const GoalsPage = lazyWithRetry(() => import('./pages/GoalsPage'))
const GoalDetailPage = lazyWithRetry(() => import('./pages/GoalDetailPage'))
const ActionItemsPage = lazyWithRetry(() => import('./pages/ActionItemsPage'))
const ProtocolsPage = lazyWithRetry(() => import('./pages/ProtocolsPage'))
const ProtocolDetailPage = lazyWithRetry(() => import('./pages/ProtocolDetailPage'))
const MyProtocolsPage = lazyWithRetry(() => import('./pages/MyProtocolsPage'))
const InterestGroupsPage = lazyWithRetry(() => import('./pages/InterestGroupsPage'))
const KPIsPage = lazyWithRetry(() => import('./pages/KPIsPage'))
const MilestonesPage = lazyWithRetry(() => import('./pages/MilestonesPage'))
const AccountabilityPage = lazyWithRetry(() => import('./pages/AccountabilityPage'))


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
    mutations: {
      onError: (error) => {
        if (import.meta.env.DEV) {
          console.error('[Mutation error]', error)
        }
      },
    },
  },
})

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <PageErrorBoundary>{children}</PageErrorBoundary>
    </ProtectedRoute>
  )
}

/** Premium routes require client or expert user_type (bought a protocol or expert session) */
function PremiumProtected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <PageErrorBoundary>
        <RequireUserType types={['client', 'expert']}>{children}</RequireUserType>
      </PageErrorBoundary>
    </ProtectedRoute>
  )
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

      // Protected routes - Onboarding (no sidebar layout)
      { path: '/onboarding', element: <Protected><OnboardingWelcomePage /></Protected> },
      { path: '/onboarding/welcome', element: <Protected><OnboardingWelcomePage /></Protected> },
      { path: '/onboarding/assessment', element: <Protected><OnboardingAssessmentPage /></Protected> },
      { path: '/onboarding/results', element: <Protected><OnboardingResultsPage /></Protected> },
      { path: '/onboarding/challenge', element: <Protected><OnboardingChallengePage /></Protected> },
      { path: '/onboarding/path', element: <Protected><OnboardingPathPage /></Protected> },

      // Protected routes - Core Pages
      { path: '/', element: <Protected><HubPage /></Protected> },
      { path: '/profile', element: <Protected><ProfilePage /></Protected> },
      { path: '/billing', element: <Protected><BillingPage /></Protected> },
      { path: '/members/billing', element: <Protected><BillingPage /></Protected> },
      { path: '/resources', element: <Protected><ResourcesPage /></Protected> },
      { path: '/notifications', element: <Protected><NotificationsPage /></Protected> },

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

      // Protected routes - Events
      { path: '/events', element: <Protected><EventsPage /></Protected> },
      { path: '/events/:id', element: <Protected><EventDetailPage /></Protected> },

      // Protected routes - Coaching
      { path: '/coaching/sessions', element: <Protected><CoachingSessionsPage /></Protected> },
      { path: '/coaching/resources', element: <Protected><CoachingResourcesPage /></Protected> },
      { path: '/coaching/session-notes', element: <Protected><SessionNotesPage /></Protected> },
      { path: '/coaching/quarterly-reviews', element: <Protected><QuarterlyReviewsPage /></Protected> },

      // Protected routes - Expert Sessions
      { path: '/expert-sessions', element: <Protected><ExpertSessionsPage /></Protected> },

      // Protected routes - Assessment (all tiers)
      { path: '/assessment', element: <Protected><AssessmentPage /></Protected> },
      { path: '/assessment/take', element: <Protected><AssessmentTakePage /></Protected> },
      { path: '/assessment/results', element: <Protected><AssessmentResultsPage /></Protected> },

      // Protected routes - Transformation Tracking (coaching tier required)
      { path: '/goals', element: <PremiumProtected><GoalsPage /></PremiumProtected> },
      { path: '/goals/:id', element: <PremiumProtected><GoalDetailPage /></PremiumProtected> },
      { path: '/action-items', element: <PremiumProtected><ActionItemsPage /></PremiumProtected> },
      { path: '/protocols', element: <PremiumProtected><ProtocolsPage /></PremiumProtected> },
      { path: '/protocols/:slug', element: <PremiumProtected><ProtocolDetailPage /></PremiumProtected> },
      { path: '/my-protocols', element: <PremiumProtected><MyProtocolsPage /></PremiumProtected> },
      { path: '/kpis', element: <PremiumProtected><KPIsPage /></PremiumProtected> },
      { path: '/milestones', element: <PremiumProtected><MilestonesPage /></PremiumProtected> },
      { path: '/accountability', element: <PremiumProtected><AccountabilityPage /></PremiumProtected> },

      // Protected routes - Interest Groups (all tiers for now)
      { path: '/interest-groups', element: <Protected><InterestGroupsPage /></Protected> },

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
          <BugReportProvider>
            <GlobalErrorBoundary>
              <RouterProvider router={router} />
            </GlobalErrorBoundary>
            <BugReportPanel />
            <BugReportToast />
          </BugReportProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
