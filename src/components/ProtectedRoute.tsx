import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOnboardingState } from '../lib/api/hooks/useOnboarding'
import { Loader2 } from 'lucide-react'

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
  const onboardingComplete = onboarding?.step === 'complete' || !!onboarding?.completed_at

  // Completed users: redirect away from onboarding pages (prevent re-entering)
  if (onboardingComplete && isOnboardingRoute) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
