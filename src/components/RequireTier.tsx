import { Navigate, useLocation, Link } from 'react-router-dom'
import { Loader2, Lock, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription, meetsTierRequirement, type SubscriptionTier } from '../lib/api/hooks/useSubscription'

interface RequireTierProps {
  minTier: SubscriptionTier
  children: React.ReactNode
  fallback?: 'upgrade' | 'redirect'
}

const TIER_NAMES: Record<SubscriptionTier, string> = {
  none: 'Free',
  brotherhood: 'Brotherhood',
  coaching: 'Expert Guidance',
  programs: 'The Forge',
}

/**
 * Route guard that checks subscription tier.
 * - If user doesn't meet the minimum tier, shows upgrade CTA or redirects.
 * - Superadmin always passes.
 */
export function RequireTier({ minTier, children, fallback = 'upgrade' }: RequireTierProps) {
  const { user, userType } = useAuth()
  const location = useLocation()
  const { data: subscription, isLoading } = useSubscription()

  // Not logged in - redirect to login
  if (!user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />
  }

  // Superadmin bypasses tier check
  if (userType === 'superadmin') {
    return <>{children}</>
  }

  // Loading subscription data
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-koppar animate-spin" />
      </div>
    )
  }

  const userTier = subscription?.tier || 'none'

  // User meets tier requirement
  if (meetsTierRequirement(userTier, minTier)) {
    return <>{children}</>
  }

  // User doesn't meet tier - show fallback
  if (fallback === 'redirect') {
    return <Navigate to="/" replace />
  }

  // Show upgrade CTA
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        {/* Lock icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-koppar/20 to-brandAmber/20 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-koppar" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-display font-bold text-kalkvit mb-3">
          Premium Feature
        </h2>

        {/* Description */}
        <p className="text-kalkvit/60 mb-2">
          This feature requires <span className="text-koppar font-medium">{TIER_NAMES[minTier]}</span> membership or higher.
        </p>
        <p className="text-kalkvit/40 text-sm mb-8">
          You're currently on the <span className="text-kalkvit/60">{TIER_NAMES[userTier]}</span> plan.
        </p>

        {/* Features preview */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
          <h3 className="text-sm font-medium text-kalkvit/80 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-koppar" />
            What you'll unlock:
          </h3>
          <ul className="space-y-2 text-sm text-kalkvit/60">
            <li className="flex items-start gap-2">
              <span className="text-skogsgron">✓</span>
              Personalized transformation protocols
            </li>
            <li className="flex items-start gap-2">
              <span className="text-skogsgron">✓</span>
              Goal setting and progress tracking
            </li>
            <li className="flex items-start gap-2">
              <span className="text-skogsgron">✓</span>
              KPI dashboards and insights
            </li>
            <li className="flex items-start gap-2">
              <span className="text-skogsgron">✓</span>
              Accountability partner matching
            </li>
          </ul>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/shop/upgrade"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-koppar to-brandAmber text-charcoal font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            View Upgrade Options
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-kalkvit font-medium rounded-lg hover:bg-white/10 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
