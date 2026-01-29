import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { CreditCard, Download, ExternalLink, CheckCircle, Loader2 } from 'lucide-react'
import { api } from '../lib/api/client'

// API response types
interface BillingInfo {
  subscription: {
    tier: string
    status: string
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
  }
  payment_method: {
    type: string
    last4: string
    brand: string
    exp_month: number
    exp_year: number
  }
}

interface Invoice {
  id: string
  amount: number
  currency: string
  status: string
  invoice_url: string
  created_at: string
}

interface InvoicesResponse {
  invoices: Invoice[]
}

interface PortalResponse {
  url: string
}

const planFeatures = [
  'Full community access',
  'Unlimited messaging',
  'Expert coaching sessions',
  'Premium protocols',
  'Circle memberships',
  'Priority support',
]

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTier(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

export function BillingPage() {
  const [portalLoading, setPortalLoading] = useState(false)

  const {
    data: billing,
    isLoading: billingLoading,
    error: billingError,
  } = useQuery({
    queryKey: ['billing'],
    queryFn: () => api.get<BillingInfo>('/members/billing'),
  })

  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    error: invoicesError,
  } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: async () => {
      const data = await api.get<InvoicesResponse>('/members/billing/invoices')
      return data.invoices
    },
  })

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const data = await api.post<PortalResponse>('/members/billing/portal')
      window.location.href = data.url
    } catch (err) {
      console.error('Failed to open billing portal:', err)
      setPortalLoading(false)
    }
  }

  const subscription = billing?.subscription
  const paymentMethod = billing?.payment_method
  const invoices = invoicesData ?? []

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Billing</h1>
          <p className="text-kalkvit/60">Manage your subscription and payment methods</p>
        </div>

        {/* Current Plan */}
        <GlassCard variant="accent" leftBorder={false} className="mb-6">
          {billingLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-kalkvit/60 animate-spin" />
            </div>
          ) : billingError ? (
            <p className="text-red-400">Failed to load subscription details.</p>
          ) : subscription ? (
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="font-serif text-2xl font-bold text-kalkvit">
                    {formatTier(subscription.tier)} Membership
                  </h2>
                  <GlassBadge variant="koppar">
                    {subscription.cancel_at_period_end
                      ? 'Canceling'
                      : subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </GlassBadge>
                </div>
                <p className="text-kalkvit/60 mb-4">
                  Your next billing date is {formatDate(subscription.current_period_end)}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-kalkvit">$99</span>
                  <span className="text-kalkvit/60">/month</span>
                </div>
              </div>
              <GlassButton
                variant="secondary"
                onClick={handleManageBilling}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Manage Billing
              </GlassButton>
            </div>
          ) : null}
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
            <GlassButton
              variant="ghost"
              className="text-sm"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              Update
            </GlassButton>
          </div>
          {billingLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-kalkvit/60 animate-spin" />
            </div>
          ) : billingError ? (
            <p className="text-red-400">Failed to load payment method.</p>
          ) : paymentMethod ? (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04]">
              <div className="w-12 h-8 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-kalkvit font-medium">
                  {paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)} ····{' '}
                  {paymentMethod.last4}
                </p>
                <p className="text-sm text-kalkvit/50">
                  Expires {String(paymentMethod.exp_month).padStart(2, '0')}/{paymentMethod.exp_year}
                </p>
              </div>
            </div>
          ) : null}
        </GlassCard>

        {/* Billing History */}
        <GlassCard variant="base">
          <h3 className="font-display text-xl font-semibold text-kalkvit mb-4">Billing History</h3>
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-kalkvit/60 animate-spin" />
            </div>
          ) : invoicesError ? (
            <p className="text-red-400">Failed to load billing history.</p>
          ) : invoices.length === 0 ? (
            <p className="text-kalkvit/60">No invoices yet.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04]"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-kalkvit font-medium">{invoice.id}</p>
                      <p className="text-sm text-kalkvit/50">{formatDate(invoice.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-kalkvit font-semibold">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </span>
                    <GlassBadge variant="success">
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </GlassBadge>
                    {invoice.invoice_url && (
                      <a
                        href={invoice.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/60 hover:text-kalkvit"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </MainLayout>
  )
}
