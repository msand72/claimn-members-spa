import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassAlert } from '../components/ui'
import { useCheckout, useSubscription, usePlans } from '../lib/api/hooks'
import type { PlanInfo } from '../lib/api/hooks'
import { isAllowedExternalUrl } from '../lib/url-validation'
import {
  Check,
  X,
  Star,
  Zap,
  Crown,
  ArrowRight,
  Shield,
  Users,
  BookOpen,
  Video,
  MessageCircle,
  Award,
  Loader2,
} from 'lucide-react'
import { cn } from '../lib/utils'

// UI-only metadata per tier (icons, popularity, "not included" features for comparison)
const tierMeta: Record<string, { icon: React.ElementType; isPopular: boolean; notIncluded: string[] }> = {
  brotherhood: {
    icon: Star,
    isPopular: false,
    notIncluded: ['Expert 1:1 sessions', 'Quarterly intensives'],
  },
  coaching: {
    icon: Zap,
    isPopular: true,
    notIncluded: ['Forge cohort access'],
  },
  programs: {
    icon: Crown,
    isPopular: false,
    notIncluded: [],
  },
}

// Features that should be visually highlighted
const highlightedFeatures = new Set([
  'Bi-weekly 1:1 expert sessions (60-75 min)',
  'Monthly Brotherhood Circles (8-12 ppl)',
  'Quarterly 2-day intensives',
  '6-12 month cohort intensive',
  'Forge Sessions (2-day, 4-6x/year)',
  'Protocol Sprints with field application',
])

function PlanCardSkeleton() {
  return (
    <GlassCard variant="base" leftBorder={false}>
      <div className="animate-pulse space-y-4">
        <div className="flex justify-center"><div className="w-12 h-12 rounded-xl bg-white/[0.08]" /></div>
        <div className="h-6 w-32 bg-white/[0.08] rounded mx-auto" />
        <div className="h-4 w-48 bg-white/[0.08] rounded mx-auto" />
        <div className="h-10 w-24 bg-white/[0.08] rounded mx-auto" />
        <div className="h-10 w-full bg-white/[0.08] rounded" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-white/[0.06] rounded w-full" />
          ))}
        </div>
      </div>
    </GlassCard>
  )
}

function PlanCard({ plan, isAnnual, isCurrent, onUpgrade, isLoading }: {
  plan: PlanInfo
  isAnnual: boolean
  isCurrent: boolean
  onUpgrade: (priceId: string, tier: string) => void
  isLoading: boolean
}) {
  const meta = tierMeta[plan.tier] || { icon: Star, isPopular: false, notIncluded: [] }
  const Icon = meta.icon

  const monthlyPrice = plan.monthly?.amount || 0
  const annualPrice = plan.annual?.amount || 0
  const monthlyEquiv = annualPrice > 0 ? Math.round(annualPrice / 12) : 0
  const savingsPercent = monthlyPrice > 0 && annualPrice > 0
    ? Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100)
    : 0

  const priceId = isAnnual
    ? (plan.annual?.price_id || '')
    : (plan.monthly?.price_id || '')

  return (
    <GlassCard
      variant={meta.isPopular ? 'accent' : 'base'}
      leftBorder={false}
      className={cn(
        'relative',
        meta.isPopular && 'ring-2 ring-koppar'
      )}
    >
      {meta.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <GlassBadge variant="koppar" className="shadow-lg">
            Recommended
          </GlassBadge>
        </div>
      )}

      <div className="text-center mb-6">
        <div className={cn(
          'w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center',
          isCurrent ? 'bg-white/[0.06]' : 'bg-koppar/20'
        )}>
          <Icon className={cn('w-6 h-6', isCurrent ? 'text-kalkvit/50' : 'text-koppar')} />
        </div>
        <h3 className="font-display text-2xl font-bold text-kalkvit">{plan.name}</h3>
        <p className="text-sm text-kalkvit/60 mt-1">{plan.description}</p>
      </div>

      <div className="text-center mb-6">
        {monthlyPrice === 0 ? (
          <p className="font-display text-4xl font-bold text-kalkvit">Free</p>
        ) : isAnnual ? (
          <>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-display text-lg text-kalkvit/40 line-through">€{monthlyPrice}</span>
              <span className="font-display text-4xl font-bold text-kalkvit">€{monthlyEquiv}</span>
              <span className="text-kalkvit/50">/mo</span>
            </div>
            <p className="text-xs text-kalkvit/50 mt-1">
              Billed at €{annualPrice.toLocaleString()}/year
            </p>
            <GlassBadge variant="success" className="mt-2">
              Save {savingsPercent}%
            </GlassBadge>
          </>
        ) : (
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-display text-4xl font-bold text-kalkvit">€{monthlyPrice}</span>
            <span className="text-kalkvit/50">/mo</span>
          </div>
        )}
      </div>

      {isCurrent ? (
        <GlassButton variant="ghost" className="w-full mb-6" disabled>
          Current Plan
        </GlassButton>
      ) : (
        <GlassButton
          variant={meta.isPopular ? 'primary' : 'secondary'}
          className="w-full mb-6"
          onClick={() => onUpgrade(priceId, plan.tier)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Upgrade to {plan.name}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </GlassButton>
      )}

      <ul className="space-y-3">
        {plan.features.map((feature, i) => (
          <li
            key={i}
            className="flex items-center gap-3 text-sm text-kalkvit/70"
          >
            <Check className={cn('w-5 h-5 flex-shrink-0', highlightedFeatures.has(feature) ? 'text-skogsgron' : 'text-kalkvit/50')} />
            <span className={highlightedFeatures.has(feature) ? 'font-medium text-kalkvit' : ''}>
              {feature}
            </span>
          </li>
        ))}
        {meta.notIncluded.map((feature, i) => (
          <li
            key={`not-${i}`}
            className="flex items-center gap-3 text-sm text-kalkvit/30"
          >
            <X className="w-5 h-5 text-kalkvit/20 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}

export function ShopUpgradePage() {
  const [isAnnual, setIsAnnual] = useState(true)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const checkout = useCheckout()
  const { data: subscription } = useSubscription()
  const { data: plansData, isLoading: isLoadingPlans, error: plansError } = usePlans()
  const currentTier = subscription?.tier || 'none'

  const plans = plansData?.plans || []

  const handleUpgrade = (priceId: string, tier: string) => {
    setCheckoutError(null)
    if (!priceId) {
      setCheckoutError('Checkout is not configured for this plan. Please contact support.')
      return
    }
    checkout.mutate(
      {
        price_id: priceId,
        tier,
        success_url: `${window.location.origin}/shop/success`,
        cancel_url: `${window.location.origin}/shop/upgrade`,
      },
      {
        onSuccess: (data) => {
          if (isAllowedExternalUrl(data.url)) {
            window.location.href = data.url
          } else {
            setCheckoutError('Invalid checkout URL. Please try again or contact support.')
          }
        },
        onError: () => {
          setCheckoutError('Failed to start checkout. Please try again.')
        },
      }
    )
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-kalkvit mb-4">
            Upgrade Your Membership
          </h1>
          <p className="text-lg text-kalkvit/60 max-w-2xl mx-auto">
            Unlock premium features, exclusive content, and accelerate your growth with a higher tier membership.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={cn('text-sm', !isAnnual ? 'text-kalkvit' : 'text-kalkvit/50')}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={cn(
              'w-14 h-8 rounded-full relative transition-colors',
              isAnnual ? 'bg-koppar' : 'bg-white/[0.2]'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 bg-kalkvit rounded-full absolute top-1 transition-transform',
                isAnnual ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </button>
          <span className={cn('text-sm', isAnnual ? 'text-kalkvit' : 'text-kalkvit/50')}>
            Annual
            <GlassBadge variant="success" className="ml-2">Save up to 26%</GlassBadge>
          </span>
        </div>

        {/* Plans Grid */}
        {checkoutError && (
          <GlassAlert variant="error" className="mb-6">
            {checkoutError}
          </GlassAlert>
        )}

        {plansError && (
          <GlassAlert variant="error" className="mb-6">
            Failed to load pricing. Please refresh the page.
          </GlassAlert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {isLoadingPlans ? (
            <>
              <PlanCardSkeleton />
              <PlanCardSkeleton />
              <PlanCardSkeleton />
            </>
          ) : (
            plans.map((plan) => (
              <PlanCard
                key={plan.tier}
                plan={plan}
                isAnnual={isAnnual}
                isCurrent={plan.tier === currentTier}
                onUpgrade={handleUpgrade}
                isLoading={checkout.isPending}
              />
            ))
          )}
        </div>

        {/* Features Comparison */}
        <GlassCard variant="base" className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-kalkvit text-center mb-8">
            What's Included
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-koppar/20 mx-auto mb-3 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-koppar" />
              </div>
              <h3 className="font-medium text-kalkvit mb-1">Premium Protocols</h3>
              <p className="text-xs text-kalkvit/50">Structured programs for transformation</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-koppar/20 mx-auto mb-3 flex items-center justify-center">
                <Video className="w-6 h-6 text-koppar" />
              </div>
              <h3 className="font-medium text-kalkvit mb-1">Expert Sessions</h3>
              <p className="text-xs text-kalkvit/50">1:1 coaching with top experts</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-koppar/20 mx-auto mb-3 flex items-center justify-center">
                <Users className="w-6 h-6 text-koppar" />
              </div>
              <h3 className="font-medium text-kalkvit mb-1">Premium Circles</h3>
              <p className="text-xs text-kalkvit/50">Curated mastermind groups</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-koppar/20 mx-auto mb-3 flex items-center justify-center">
                <Award className="w-6 h-6 text-koppar" />
              </div>
              <h3 className="font-medium text-kalkvit mb-1">Sprints & Challenges</h3>
              <p className="text-xs text-kalkvit/50">Intensive group challenges</p>
            </div>
          </div>
        </GlassCard>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-kalkvit/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-skogsgron" />
            30-day money-back guarantee
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-koppar" />
            Cancel anytime
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-brand-amber" />
            4.9/5 member satisfaction
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default ShopUpgradePage;
