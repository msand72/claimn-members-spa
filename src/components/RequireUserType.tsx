import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { UserType } from '../lib/auth'

interface RequireUserTypeProps {
  types: UserType[]
  children: React.ReactNode
  fallback?: 'upgrade' | 'redirect'
}

/**
 * Route guard that checks user_type.
 * - If user doesn't match any of the allowed types, shows upgrade CTA or redirects.
 * - Superadmin always passes.
 */
export function RequireUserType({ types, children, fallback = 'upgrade' }: RequireUserTypeProps) {
  const { user, hasAccess } = useAuth()
  const location = useLocation()

  if (!user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />
  }

  if (!hasAccess(...types)) {
    if (fallback === 'redirect') {
      return <Navigate to="/" replace />
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-koppar/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-koppar" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="text-xl font-display font-bold text-charcoal dark:text-kalkvit mb-2">
            Upgrade to Access This Feature
          </h2>
          <p className="text-jordbrun dark:text-kalkvit/60 text-sm mb-6">
            This feature requires a higher membership tier. Upgrade your plan to unlock it.
          </p>
          <a
            href="/shop/upgrade"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-koppar text-charcoal font-medium rounded-lg hover:bg-koppar/90 transition-colors"
          >
            View Plans
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
