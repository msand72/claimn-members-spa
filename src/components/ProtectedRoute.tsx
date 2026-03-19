import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOnboardingState } from '../lib/api/hooks/useOnboarding'
import { useSubscription } from '../lib/api/hooks/useSubscription'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

// Routes accessible without an active subscription
const SUBSCRIPTION_EXEMPT_ROUTES = [
  '/shop/upgrade',
  '/shop/success',
  '/billing',
  '/profile',
  '/onboarding',
]

function isSubscriptionExempt(pathname: string): boolean {
  return SUBSCRIPTION_EXEMPT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const { data: onboarding, isLoading: onboardingLoading } = useOnboardingState()
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription()

  if (loading || onboardingLoading || subscriptionLoading) {
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

  // Subscription gate: users without an active subscription get redirected to upgrade page
  if (!isSubscriptionExempt(location.pathname)) {
    const tier = subscription?.tier || 'none'
    const status = subscription?.status || 'inactive'
    const hasActiveSubscription = tier !== 'none' && (status === 'active' || status === 'trialing')

    if (!hasActiveSubscription) {
      return <Navigate to="/shop/upgrade" replace />
    }
  }

  return <>{children}</>
}
