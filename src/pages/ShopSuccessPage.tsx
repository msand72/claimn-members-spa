import { useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton } from '../components/ui'
import { useVerifyCheckout } from '../lib/api/hooks'
import {
  CheckCircle,
  ArrowRight,
  BookOpen,
  Users,
  Calendar,
  Download,
  Mail,
  Sparkles,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

export function ShopSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id') || ''

  const { data: verification, isLoading, isError } = useVerifyCheckout(sessionId)

  // Auto-redirect to dashboard after 5 seconds on success
  useEffect(() => {
    if (verification?.success) {
      const timer = setTimeout(() => navigate('/'), 5000)
      return () => clearTimeout(timer)
    }
  }, [verification?.success, navigate])

  if (isLoading && sessionId) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-koppar" />
          <p className="text-kalkvit/60">Verifying your purchase...</p>
        </div>
      </MainLayout>
    )
  }

  if (isError || (verification && !verification.success)) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto text-center py-24">
          <div className="w-24 h-24 rounded-full bg-tegelrod/20 mx-auto flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-tegelrod" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-4">
            Verification Failed
          </h1>
          <p className="text-kalkvit/60 mb-6">
            We couldn't verify your purchase. If you were charged, please contact support.
          </p>
          <div className="flex flex-col gap-3 items-center">
            <Link to="/shop/upgrade">
              <GlassButton variant="primary">
                Try Again
                <ArrowRight className="w-4 h-4" />
              </GlassButton>
            </Link>
            <a href="mailto:support@claimn.co" className="text-sm text-koppar hover:underline">
              Contact support@claimn.co
            </a>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Use verified data if available, fall back to static placeholder
  const planName = verification?.plan_name || verification?.item_name || 'Pro Membership'
  const billingCycle = verification?.billing_cycle || 'Annual'
  const amountPaid = verification?.amount_paid
    ? `${verification.currency === 'eur' ? '€' : '$'}${(verification.amount_paid / 100).toFixed(2)}`
    : '$970.00'
  const nextBillingDate = verification?.next_billing_date
    ? new Date(verification.next_billing_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'January 26, 2027'
  const email = verification?.email || 'your@email.com'

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="w-24 h-24 rounded-full bg-skogsgron/20 mx-auto flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-skogsgron" />
          </div>
          <h1 className="font-display text-4xl font-bold text-kalkvit mb-4">
            Purchase Successful!
          </h1>
          <p className="text-lg text-kalkvit/60">
            Your upgrade was successful. You now have access to all premium features.
          </p>
          {sessionId && (
            <p className="text-sm text-kalkvit/40 mt-2">
              Redirecting to dashboard in 5 seconds...
            </p>
          )}
        </div>

        {/* Order Summary */}
        <GlassCard variant="base" className="mb-8 text-left">
          <h2 className="font-semibold text-kalkvit mb-4">Order Summary</h2>
          <div className="space-y-3 pb-4 border-b border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-kalkvit/60">Plan</span>
              <span className="text-kalkvit">{planName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-kalkvit/60">Billing Cycle</span>
              <span className="text-kalkvit">{billingCycle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-kalkvit/60">Amount Paid</span>
              <span className="text-kalkvit">{amountPaid}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-kalkvit/60">Next Billing Date</span>
              <span className="text-kalkvit">{nextBillingDate}</span>
            </div>
          </div>
          <div className="pt-4 flex items-center justify-between">
            <span className="text-sm text-kalkvit/60">Confirmation sent to</span>
            <span className="text-sm text-kalkvit flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {email}
            </span>
          </div>
        </GlassCard>

        {/* What's Next */}
        <GlassCard variant="elevated" className="mb-8">
          <h2 className="font-semibold text-kalkvit mb-6 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-koppar" />
            What's Next
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/shop/protocols" className="block">
              <div className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-koppar/20">
                    <BookOpen className="w-5 h-5 text-koppar" />
                  </div>
                  <h3 className="font-medium text-kalkvit">Browse Protocols</h3>
                </div>
                <p className="text-sm text-kalkvit/60">
                  Explore all premium protocols now available to you
                </p>
              </div>
            </Link>
            <Link to="/programs/sprints" className="block">
              <div className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-koppar/20">
                    <Users className="w-5 h-5 text-koppar" />
                  </div>
                  <h3 className="font-medium text-kalkvit">Join a Sprint</h3>
                </div>
                <p className="text-sm text-kalkvit/60">
                  Start an intensive group challenge this week
                </p>
              </div>
            </Link>
            <Link to="/book-session" className="block">
              <div className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-koppar/20">
                    <Calendar className="w-5 h-5 text-koppar" />
                  </div>
                  <h3 className="font-medium text-kalkvit">Book a Session</h3>
                </div>
                <p className="text-sm text-kalkvit/60">
                  Schedule your first expert coaching session
                </p>
              </div>
            </Link>
            <Link to="/billing" className="block">
              <div className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-koppar/20">
                    <Download className="w-5 h-5 text-koppar" />
                  </div>
                  <h3 className="font-medium text-kalkvit">View Receipt</h3>
                </div>
                <p className="text-sm text-kalkvit/60">
                  View invoices and receipts in your billing history
                </p>
              </div>
            </Link>
          </div>
        </GlassCard>

        {/* CTA */}
        <Link to="/">
          <GlassButton variant="primary" className="px-8">
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </GlassButton>
        </Link>

        <p className="text-sm text-kalkvit/40 mt-6">
          Questions? Contact us at{' '}
          <a href="mailto:support@claimn.co" className="text-koppar hover:underline">
            support@claimn.co
          </a>
        </p>
      </div>
    </MainLayout>
  )
}

export default ShopSuccessPage
