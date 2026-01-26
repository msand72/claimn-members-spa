import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton } from '../components/ui'
import {
  CheckCircle,
  ArrowRight,
  BookOpen,
  Users,
  Calendar,
  Download,
  Mail,
  Sparkles,
} from 'lucide-react'

export function ShopSuccessPage() {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="w-24 h-24 rounded-full bg-skogsgron/20 mx-auto flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-skogsgron" />
          </div>
          <h1 className="font-display text-4xl font-bold text-kalkvit mb-4">
            Welcome to Pro!
          </h1>
          <p className="text-lg text-kalkvit/60">
            Your upgrade was successful. You now have access to all Pro features.
          </p>
        </div>

        {/* Order Summary */}
        <GlassCard variant="base" className="mb-8 text-left">
          <h2 className="font-semibold text-kalkvit mb-4">Order Summary</h2>
          <div className="space-y-3 pb-4 border-b border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-kalkvit/60">Plan</span>
              <span className="text-kalkvit">Pro Membership (Annual)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-kalkvit/60">Billing Cycle</span>
              <span className="text-kalkvit">Yearly</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-kalkvit/60">Amount Paid</span>
              <span className="text-kalkvit">$970.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-kalkvit/60">Next Billing Date</span>
              <span className="text-kalkvit">January 26, 2027</span>
            </div>
          </div>
          <div className="pt-4 flex items-center justify-between">
            <span className="text-sm text-kalkvit/60">Confirmation sent to</span>
            <span className="text-sm text-kalkvit flex items-center gap-2">
              <Mail className="w-4 h-4" />
              your@email.com
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
            <a href="#" className="block">
              <div className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-koppar/20">
                    <Download className="w-5 h-5 text-koppar" />
                  </div>
                  <h3 className="font-medium text-kalkvit">Download Receipt</h3>
                </div>
                <p className="text-sm text-kalkvit/60">
                  Get a PDF receipt for your records
                </p>
              </div>
            </a>
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
