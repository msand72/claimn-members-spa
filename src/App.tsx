import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'

// Pages - Auth
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

// Pages - Core
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { BillingPage } from './pages/BillingPage'
import { ResourcesPage } from './pages/ResourcesPage'

// Pages - Community
import { FeedPage } from './pages/FeedPage'
import { MessagesPage } from './pages/MessagesPage'
import { ConnectionsPage } from './pages/ConnectionsPage'
import { CirclesPage } from './pages/CirclesPage'
import { CircleDetailPage } from './pages/CircleDetailPage'
import { NetworkPage } from './pages/NetworkPage'

// Pages - Shop & Experts
import { ShopPage } from './pages/ShopPage'
import { ShopProtocolsPage } from './pages/ShopProtocolsPage'
import { ShopProtocolDetailPage } from './pages/ShopProtocolDetailPage'
import { ShopCirclesPage } from './pages/ShopCirclesPage'
import { ShopUpgradePage } from './pages/ShopUpgradePage'
import { ShopSuccessPage } from './pages/ShopSuccessPage'
import { BookSessionPage } from './pages/BookSessionPage'
import { ExpertsPage } from './pages/ExpertsPage'
import { ExpertSessionsPage } from './pages/ExpertSessionsPage'
import { ExpertProfilePage } from './pages/ExpertProfilePage'
import { ProgramsPage } from './pages/ProgramsPage'
import { ProgramsSprintsPage } from './pages/ProgramsSprintsPage'
import { ProgramsReviewsPage } from './pages/ProgramsReviewsPage'

// Pages - Coaching
import { CoachingSessionsPage } from './pages/CoachingSessionsPage'
import { CoachingResourcesPage } from './pages/CoachingResourcesPage'
import { SessionNotesPage } from './pages/SessionNotesPage'

// Pages - Transformation Tracking
import { AssessmentPage } from './pages/AssessmentPage'
import { AssessmentTakePage } from './pages/AssessmentTakePage'
import { AssessmentResultsPage } from './pages/AssessmentResultsPage'
import { GoalsPage } from './pages/GoalsPage'
import { GoalDetailPage } from './pages/GoalDetailPage'
import { ActionItemsPage } from './pages/ActionItemsPage'
import { ProtocolsPage } from './pages/ProtocolsPage'
import { ProtocolDetailPage } from './pages/ProtocolDetailPage'
import { InterestGroupsPage } from './pages/InterestGroupsPage'
import { KPIsPage } from './pages/KPIsPage'
import { MilestonesPage } from './pages/MilestonesPage'
import { AccountabilityPage } from './pages/AccountabilityPage'


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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            {/* Public routes - Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes - Core Pages */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resources"
              element={
                <ProtectedRoute>
                  <ResourcesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Community Pages */}
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <FeedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/connections"
              element={
                <ProtectedRoute>
                  <ConnectionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/circles"
              element={
                <ProtectedRoute>
                  <CirclesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/circles/:id"
              element={
                <ProtectedRoute>
                  <CircleDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/network"
              element={
                <ProtectedRoute>
                  <NetworkPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Shop & Experts */}
            <Route
              path="/shop"
              element={
                <ProtectedRoute>
                  <ShopPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book-session"
              element={
                <ProtectedRoute>
                  <BookSessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/experts"
              element={
                <ProtectedRoute>
                  <ExpertsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/experts/:id"
              element={
                <ProtectedRoute>
                  <ExpertProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/programs"
              element={
                <ProtectedRoute>
                  <ProgramsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/programs/sprints"
              element={
                <ProtectedRoute>
                  <ProgramsSprintsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/programs/reviews"
              element={
                <ProtectedRoute>
                  <ProgramsReviewsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Coaching */}
            <Route
              path="/coaching/sessions"
              element={
                <ProtectedRoute>
                  <CoachingSessionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coaching/resources"
              element={
                <ProtectedRoute>
                  <CoachingResourcesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coaching/session-notes"
              element={
                <ProtectedRoute>
                  <SessionNotesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Expert Sessions */}
            <Route
              path="/expert-sessions"
              element={
                <ProtectedRoute>
                  <ExpertSessionsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Transformation Tracking */}
            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <AssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/take"
              element={
                <ProtectedRoute>
                  <AssessmentTakePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/results"
              element={
                <ProtectedRoute>
                  <AssessmentResultsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <GoalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals/:id"
              element={
                <ProtectedRoute>
                  <GoalDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/action-items"
              element={
                <ProtectedRoute>
                  <ActionItemsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/protocols"
              element={
                <ProtectedRoute>
                  <ProtocolsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/protocols/:slug"
              element={
                <ProtectedRoute>
                  <ProtocolDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interest-groups"
              element={
                <ProtectedRoute>
                  <InterestGroupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpis"
              element={
                <ProtectedRoute>
                  <KPIsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/milestones"
              element={
                <ProtectedRoute>
                  <MilestonesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountability"
              element={
                <ProtectedRoute>
                  <AccountabilityPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Shop */}
            <Route
              path="/shop/protocols"
              element={
                <ProtectedRoute>
                  <ShopProtocolsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop/protocols/:slug"
              element={
                <ProtectedRoute>
                  <ShopProtocolDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop/circles"
              element={
                <ProtectedRoute>
                  <ShopCirclesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop/upgrade"
              element={
                <ProtectedRoute>
                  <ShopUpgradePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop/success"
              element={
                <ProtectedRoute>
                  <ShopSuccessPage />
                </ProtectedRoute>
              }
            />

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
