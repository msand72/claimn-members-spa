import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { CreditCard, Download, ExternalLink, CheckCircle } from 'lucide-react'

const invoices = [
  { id: 'INV-001', date: '2026-01-01', amount: '$99.00', status: 'paid' },
  { id: 'INV-002', date: '2025-12-01', amount: '$99.00', status: 'paid' },
  { id: 'INV-003', date: '2025-11-01', amount: '$99.00', status: 'paid' },
]

const planFeatures = [
  'Full community access',
  'Unlimited messaging',
  'Expert coaching sessions',
  'Premium protocols',
  'Circle memberships',
  'Priority support',
]

export function BillingPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Billing</h1>
          <p className="text-kalkvit/60">Manage your subscription and payment methods</p>
        </div>

        {/* Current Plan */}
        <GlassCard variant="accent" leftBorder={false} className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-serif text-2xl font-bold text-kalkvit">Brotherhood Membership</h2>
                <GlassBadge variant="koppar">Active</GlassBadge>
              </div>
              <p className="text-kalkvit/60 mb-4">Your next billing date is February 1, 2026</p>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-kalkvit">$99</span>
                <span className="text-kalkvit/60">/month</span>
              </div>
            </div>
            <GlassButton variant="secondary">
              <ExternalLink className="w-4 h-4" />
              Manage Plan
            </GlassButton>
          </div>
        </GlassCard>

        {/* Plan Features */}
        <GlassCard variant="base" className="mb-6">
          <h3 className="font-display text-xl font-semibold text-kalkvit mb-4">Plan Includes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {planFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-kalkvit/80">
                <CheckCircle className="w-5 h-5 text-skogsgron" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Payment Method */}
        <GlassCard variant="base" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-semibold text-kalkvit">Payment Method</h3>
            <GlassButton variant="ghost" className="text-sm">
              Update
            </GlassButton>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04]">
            <div className="w-12 h-8 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-kalkvit font-medium">•••• •••• •••• 4242</p>
              <p className="text-sm text-kalkvit/50">Expires 12/2028</p>
            </div>
          </div>
        </GlassCard>

        {/* Billing History */}
        <GlassCard variant="base">
          <h3 className="font-display text-xl font-semibold text-kalkvit mb-4">Billing History</h3>
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04]"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-kalkvit font-medium">{invoice.id}</p>
                    <p className="text-sm text-kalkvit/50">{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-kalkvit font-semibold">{invoice.amount}</span>
                  <GlassBadge variant="success">Paid</GlassBadge>
                  <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/60 hover:text-kalkvit">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </MainLayout>
  )
}
