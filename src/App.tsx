import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
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
import { BookSessionPage } from './pages/BookSessionPage'
import { ExpertsPage } from './pages/ExpertsPage'
import { ExpertSessionsPage } from './pages/ExpertSessionsPage'
import { ProgramsPage } from './pages/ProgramsPage'

// Pages - Coaching
import { CoachingSessionsPage } from './pages/CoachingSessionsPage'
import { CoachingResourcesPage } from './pages/CoachingResourcesPage'
import { SessionNotesPage } from './pages/SessionNotesPage'

// Layout and UI
import { MainLayout } from './components/layout/MainLayout'
import { GlassCard } from './components/ui'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
              path="/programs"
              element={
                <ProtectedRoute>
                  <ProgramsPage />
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
              path="/shop/upgrade"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Upgrade Membership" />
                </ProtectedRoute>
              }
            />

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

// Temporary placeholder component for routes not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <GlassCard variant="base">
          <h1 className="font-display text-3xl font-bold text-kalkvit mb-4">{title}</h1>
          <p className="text-kalkvit/60">
            This page is coming soon. The Glass UI foundation is ready for implementation.
          </p>
        </GlassCard>
      </div>
    </MainLayout>
  )
}

export default App
