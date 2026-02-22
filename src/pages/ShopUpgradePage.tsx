import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassAlert } from '../components/ui'
import { useCheckout, useSubscription } from '../lib/api/hooks'
import { isAllowedExternalUrl } from '../lib/url-validation'
import { MEMBERSHIP_PRICES } from '../config/stripe-prices'
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

interface Plan {
  id: string
  name: string
  description: string
  price: number
  priceAnnual: number
  priceId: string
  priceIdAnnual: string
  icon: React.ElementType
  isPopular: boolean
  features: {
    name: string
    included: boolean
    highlight?: boolean
  }[]
}

const plans: Plan[] = [
  {
    id: 'brotherhood',
    name: MEMBERSHIP_PRICES.brotherhood.monthly.label,
    description: 'Full access + community',
    price: MEMBERSHIP_PRICES.brotherhood.monthly.amount,
    priceAnnual: MEMBERSHIP_PRICES.brotherhood.annual.amount,
    priceId: MEMBERSHIP_PRICES.brotherhood.monthly.priceId,
    priceIdAnnual: MEMBERSHIP_PRICES.brotherhood.annual.priceId,
    icon: Star,
    isPopular: false,
    features: [
      { name: 'Access to ALL 50+ protocols', included: true },
      { name: 'Private community platform', included: true },
      { name: 'Monthly Brotherhood calls', included: true },
      { name: 'Peer accountability partners', included: true },
      { name: 'Exclusive events & AMAs', included: true },
      { name: 'Assessment results anytime', included: true },
      { name: 'Expert 1:1 sessions', included: false },
      { name: 'Quarterly intensives', included: false },
    ],
  },
  {
    id: 'coaching',
    name: MEMBERSHIP_PRICES.coaching.monthly.label,
    description: 'Tactical expertise + Brotherhood',
    price: MEMBERSHIP_PRICES.coaching.monthly.amount,
    priceAnnual: MEMBERSHIP_PRICES.coaching.annual.amount,
    priceId: MEMBERSHIP_PRICES.coaching.monthly.priceId,
    priceIdAnnual: MEMBERSHIP_PRICES.coaching.annual.priceId,
    icon: Zap,
    isPopular: true,
    features: [
      { name: 'Everything in Brotherhood', included: true },
      { name: 'Bi-weekly 1:1 expert sessions (60-75 min)', included: true, highlight: true },
      { name: 'Monthly Brotherhood Circles (8-12 ppl)', included: true, highlight: true },
      { name: 'Quarterly 2-day intensives', included: true, highlight: true },
      { name: 'Personalized protocol development', included: true },
      { name: 'Performance assessment & metrics', included: true },
      { name: 'Priority support & direct expert access', included: true },
      { name: 'Forge cohort access', included: false },
    ],
  },
  {
    id: 'programs',
    name: MEMBERSHIP_PRICES.programs.monthly.label,
    description: 'Identity architecture — by application',
    price: MEMBERSHIP_PRICES.programs.monthly.amount,
    priceAnnual: MEMBERSHIP_PRICES.programs.annual.amount,
    priceId: MEMBERSHIP_PRICES.programs.monthly.priceId,
    priceIdAnnual: MEMBERSHIP_PRICES.programs.annual.priceId,
    icon: Crown,
    isPopular: false,
    features: [
      { name: 'Everything in Expert Guidance', included: true },
      { name: '6-12 month cohort intensive', included: true, highlight: true },
      { name: 'Forge Sessions (2-day, 4-6x/year)', included: true, highlight: true },
      { name: 'Protocol Sprints with field application', included: true, highlight: true },
      { name: 'Trio accountability architecture', included: true },
      { name: 'Full assessment suite', included: true },
      { name: 'High-trust, discrete environment', included: true },
      { name: 'Founding Member recognition', included: true },
    ],
  },
]

function PlanCard({ plan, isAnnual, isCurrent, onUpgrade, isLoading }: { plan: Plan; isAnnual: boolean; isCurrent: boolean; onUpgrade: (priceId: string, tier: string) => void; isLoading: boolean }) {
  const price = isAnnual ? Math.round(plan.priceAnnual / 12) : plan.price
  const Icon = plan.icon

  return (
    <GlassCard
      variant={plan.isPopular ? 'accent' : 'base'}
      leftBorder={false}
      className={cn(
        'relative',
        plan.isPopular && 'ring-2 ring-koppar'
      )}
    >
      {plan.isPopular && (
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
        {plan.price === 0 ? (
          <p className="font-display text-4xl font-bold text-kalkvit">Free</p>
        ) : (
          <>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-display text-4xl font-bold text-kalkvit">€{price}</span>
              <span className="text-kalkvit/50">/mo</span>
            </div>
            {isAnnual && (
              <p className="text-sm text-skogsgron mt-1">
                Save €{plan.price * 12 - plan.priceAnnual}/year
              </p>
            )}
          </>
        )}
      </div>

      {isCurrent ? (
        <GlassButton variant="ghost" className="w-full mb-6" disabled>
          Current Plan
        </GlassButton>
      ) : (
        <GlassButton
          variant={plan.isPopular ? 'primary' : 'secondary'}
          className="w-full mb-6"
          onClick={() => onUpgrade(isAnnual ? plan.priceIdAnnual : plan.priceId, plan.id)}
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
            className={cn(
              'flex items-center gap-3 text-sm',
              feature.included ? 'text-kalkvit/70' : 'text-kalkvit/30'
            )}
          >
            {feature.included ? (
              <Check className={cn('w-5 h-5 flex-shrink-0', feature.highlight ? 'text-skogsgron' : 'text-kalkvit/50')} />
            ) : (
              <X className="w-5 h-5 text-kalkvit/20 flex-shrink-0" />
            )}
            <span className={feature.highlight ? 'font-medium text-kalkvit' : ''}>
              {feature.name}
            </span>
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
  const currentTier = subscription?.tier || 'none'

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
            <GlassBadge variant="success" className="ml-2">Save 21%</GlassBadge>
          </span>
        </div>

        {/* Plans Grid */}
        {checkoutError && (
          <GlassAlert variant="error" className="mb-6">
            {checkoutError}
          </GlassAlert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} isAnnual={isAnnual} isCurrent={plan.id === currentTier} onUpgrade={handleUpgrade} isLoading={checkout.isPending} />
          ))}
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
