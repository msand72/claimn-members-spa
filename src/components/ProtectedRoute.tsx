import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOnboardingState } from '../lib/api/hooks/useOnboarding'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  // Gated on `user`: with a dead token this query can only 401, and waiting on
  // it below would park the user on a spinner forever instead of at login.
  const { data: onboarding, isLoading: onboardingLoading } = useOnboardingState(!!user)

  // Auth verdict first. Once auth has resolved and there's no user, go to
  // login immediately — never wait on a data query to decide that.
  if (!loading && !user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />
  }

  if (loading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-glass-dark flex items-center justify-center">
        <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
      </div>
    )
  }

  const isOnboardingRoute = location.pathname.startsWith('/onboarding')
  const onboardingComplete = onboarding?.step === 'complete' || !!onboarding?.completed_at

  // Completed users: redirect away from onboarding pages (prevent re-entering)
  if (onboardingComplete && isOnboardingRoute) {
    return <Navigate to="/" replace />
  }

  // Tier-specific gating is handled by RequireTier / PremiumProtected on individual routes
  return <>{children}</>
}
