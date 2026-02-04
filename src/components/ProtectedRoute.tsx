import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOnboardingState } from '../lib/api/hooks/useOnboarding'
import { Loader2 } from 'lucide-react'

const ONBOARDING_STEP_ROUTES: Record<string, string> = {
  welcome: '/onboarding/welcome',
  profile: '/onboarding/welcome',
  challenge: '/onboarding/challenge',
  assessment: '/onboarding/assessment',
  results: '/onboarding/results',
  path: '/onboarding/path',
}

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const { data: onboarding, isLoading: onboardingLoading } = useOnboardingState()

  if (loading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-glass-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-koppar animate-spin" />
      </div>
    )
  }

  if (!user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />
  }

  const isOnboardingRoute = location.pathname.startsWith('/onboarding')
  const onboardingStep = onboarding?.step
  const onboardingComplete = onboardingStep === 'complete' || !!onboarding?.completed_at

  // Completed users: redirect away from onboarding pages
  if (onboardingComplete && isOnboardingRoute) {
    return <Navigate to="/" replace />
  }

  // Incomplete users: redirect to correct onboarding step
  if (!onboardingComplete && !isOnboardingRoute) {
    // Allow the assessment take page — onboarding redirects here for the assessment
    if (location.pathname === '/assessment/take') {
      return <>{children}</>
    }

    const targetRoute = onboardingStep
      ? ONBOARDING_STEP_ROUTES[onboardingStep] ?? '/onboarding/welcome'
      : '/onboarding/welcome'
    return <Navigate to={targetRoute} replace />
  }

  return <>{children}</>
}
