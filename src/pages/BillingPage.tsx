import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import {
  CreditCard,
  Download,
  ExternalLink,
  CheckCircle,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Receipt,
  Shield,
} from 'lucide-react'
import { useSubscription, useInvoices, useBillingPortal } from '../lib/api/hooks'
import type { Invoice } from '../lib/api/hooks'
import { isAllowedExternalUrl } from '../lib/url-validation'
import { cn } from '../lib/utils'

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTier(tier: string): string {
  const names: Record<string, string> = {
    brotherhood: 'The Brotherhood',
    coaching: 'Expert Guidance',
    programs: 'The Forge',
    none: 'Free',
  }
  return names[tier] || tier.charAt(0).toUpperCase() + tier.slice(1)
}

function StatusBadge({ status, cancelAtPeriodEnd }: { status: string; cancelAtPeriodEnd: boolean }) {
  if (cancelAtPeriodEnd) {
    return <GlassBadge variant="koppar">Canceling</GlassBadge>
  }
  if (status === 'active') {
    return <GlassBadge variant="success">Active</GlassBadge>
  }
  if (status === 'trialing') {
    return <GlassBadge variant="koppar">Trial</GlassBadge>
  }
  return <GlassBadge variant="default">{status.charAt(0).toUpperCase() + status.slice(1)}</GlassBadge>
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.06] last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
          <Receipt className="w-5 h-5 text-kalkvit/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-kalkvit">
            {formatDate(invoice.created_at)}
          </p>
          <p className="text-xs text-kalkvit/40">
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-kalkvit">
          {formatCurrency(invoice.amount, invoice.currency)}
        </span>
        {invoice.invoice_url && (
          <a
            href={invoice.invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-xs text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </a>
        )}
      </div>
    </div>
  )
}

export function BillingPage() {
  const [portalError, setPortalError] = useState<string | null>(null)

  const {
    data: subscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useSubscription()

  const {
    data: invoices = [],
    isLoading: invoicesLoading,
    error: invoicesError,
  } = useInvoices()

  const portal = useBillingPortal()

  const handleManageBilling = () => {
    setPortalError(null)
    portal.mutate(undefined, {
      onSuccess: (data) => {
        const portalUrl = data?.url
        if (portalUrl && isAllowedExternalUrl(portalUrl)) {
          window.location.href = portalUrl
        } else {
          setPortalError('Unable to open the billing portal. Please try again or contact support.')
        }
      },
      onError: () => {
        setPortalError('Unable to open the billing portal. Please try again or contact support.')
      },
    })
  }

  const hasPlan = subscription && subscription.tier !== 'none'
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
            Billing & Subscription
          </h1>
          <p className="text-kalkvit/60">
            Manage your membership plan, payment methods, and billing history
          </p>
        </div>

        {/* Portal error */}
        {portalError && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-tegelrod/10 border border-tegelrod/30">
            <AlertTriangle className="w-5 h-5 text-tegelrod flex-shrink-0 mt-0.5" />
            <p className="text-sm text-tegelrod">{portalError}</p>
          </div>
        )}

        {/* Current Plan Section */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-kalkvit/40 uppercase tracking-wider mb-3">
            Current Plan
          </h2>
          <GlassCard variant="accent" leftBorder={false} className="border border-white/[0.1]">
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-kalkvit/60 animate-spin" />
              </div>
            ) : subscriptionError ? (
              <div className="flex items-center gap-3 py-4">
                <AlertTriangle className="w-5 h-5 text-tegelrod" />
                <p className="text-kalkvit/60">Failed to load subscription details.</p>
              </div>
            ) : hasPlan && isActive ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-2xl font-bold text-kalkvit">
                        {formatTier(subscription.tier)}
                      </h3>
                      <StatusBadge
                        status={subscription.status}
                        cancelAtPeriodEnd={subscription.cancel_at_period_end}
                      />
                    </div>
                    {subscription.amount != null && subscription.currency ? (
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="font-display text-3xl font-bold text-kalkvit">
                          {formatCurrency(subscription.amount, subscription.currency)}
                        </span>
                        {subscription.interval && (
                          <span className="text-kalkvit/50">/{subscription.interval}</span>
                        )}
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2 text-sm text-kalkvit/50">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {subscription.cancel_at_period_end
                          ? `Access until ${formatDate(subscription.current_period_end)}`
                          : `Renews ${formatDate(subscription.current_period_end)}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <GlassButton
                      variant="primary"
                      onClick={handleManageBilling}
                      disabled={portal.isPending}
                    >
                      {portal.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                      Manage Subscription
                    </GlassButton>
                  </div>
                </div>

                {/* Plan Features */}
                {subscription.features && subscription.features.length > 0 && (
                  <div className="pt-5 border-t border-white/[0.08]">
                    <p className="text-xs font-medium text-kalkvit/40 uppercase tracking-wider mb-3">
                      Includes
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subscription.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-kalkvit/70">
                          <CheckCircle className="w-4 h-4 text-skogsgron flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-kalkvit/60 mb-4">
                  You don't have an active membership plan.
                </p>
                <Link to="/shop/upgrade">
                  <GlassButton variant="primary">
                    View Plans
                    <ArrowRight className="w-4 h-4" />
                  </GlassButton>
                </Link>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Payment Method Section */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-kalkvit/40 uppercase tracking-wider mb-3">
            Payment Method
          </h2>
          <GlassCard variant="base" className="border border-white/[0.08]">
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 text-kalkvit/60 animate-spin" />
              </div>
            ) : subscriptionError ? (
              <div className="flex items-center gap-3 py-4">
                <AlertTriangle className="w-5 h-5 text-tegelrod" />
                <p className="text-kalkvit/60">Failed to load payment method.</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-14 h-10 rounded-lg flex items-center justify-center',
                    'bg-gradient-to-br from-blue-600/80 to-blue-400/80',
                  )}>
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-kalkvit font-medium text-sm">
                      Card on file
                    </p>
                    <p className="text-xs text-kalkvit/40">
                      Managed through Stripe
                    </p>
                  </div>
                </div>
                <GlassButton
                  variant="primary"
                  className="text-sm"
                  onClick={handleManageBilling}
                  disabled={portal.isPending}
                >
                  {portal.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Update
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </GlassButton>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Billing History Section */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-kalkvit/40 uppercase tracking-wider mb-3">
            Billing History
          </h2>
          <GlassCard variant="base" className="border border-white/[0.08]">
            {invoicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-kalkvit/60 animate-spin" />
              </div>
            ) : invoicesError ? (
              <div className="flex items-center gap-3 py-4">
                <AlertTriangle className="w-5 h-5 text-tegelrod" />
                <p className="text-kalkvit/60">Failed to load billing history.</p>
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-kalkvit/50 text-sm py-4">No invoices yet.</p>
            ) : (
              <div>
                {invoices.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-kalkvit/30">
          <Shield className="w-4 h-4" />
          <span>Payments securely processed by Stripe</span>
        </div>
      </div>
    </MainLayout>
  )
}

export default BillingPage;
