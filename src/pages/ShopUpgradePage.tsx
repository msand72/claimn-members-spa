import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
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
} from 'lucide-react'
import { cn } from '../lib/utils'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  priceAnnual: number
  icon: React.ElementType
  isPopular: boolean
  isCurrent: boolean
  features: {
    name: string
    included: boolean
    highlight?: boolean
  }[]
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Essential access for new members',
    price: 0,
    priceAnnual: 0,
    icon: Star,
    isPopular: false,
    isCurrent: true,
    features: [
      { name: 'Community Feed Access', included: true },
      { name: 'Free Circles (up to 3)', included: true },
      { name: 'Basic Resources Library', included: true },
      { name: 'Monthly Newsletter', included: true },
      { name: 'Premium Protocols', included: false },
      { name: 'Expert Sessions', included: false },
      { name: 'Sprints & Challenges', included: false },
      { name: 'Priority Support', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For committed growth seekers',
    price: 97,
    priceAnnual: 970,
    icon: Zap,
    isPopular: true,
    isCurrent: false,
    features: [
      { name: 'Everything in Starter', included: true },
      { name: 'All Premium Protocols', included: true, highlight: true },
      { name: 'Unlimited Circles', included: true, highlight: true },
      { name: '2 Expert Sessions/month', included: true, highlight: true },
      { name: 'Sprint Participation', included: true },
      { name: 'Full Resources Library', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Annual Retreat Invite', included: false },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'Maximum acceleration & access',
    price: 297,
    priceAnnual: 2970,
    icon: Crown,
    isPopular: false,
    isCurrent: false,
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Unlimited Expert Sessions', included: true, highlight: true },
      { name: 'Exclusive Mastermind Access', included: true, highlight: true },
      { name: '1:1 Coaching (Monthly)', included: true, highlight: true },
      { name: 'Early Access to Content', included: true },
      { name: 'White-Glove Support', included: true },
      { name: 'Annual Retreat Included', included: true },
      { name: 'Founding Member Badge', included: true },
    ],
  },
]

function PlanCard({ plan, isAnnual }: { plan: Plan; isAnnual: boolean }) {
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
            Most Popular
          </GlassBadge>
        </div>
      )}

      <div className="text-center mb-6">
        <div className={cn(
          'w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center',
          plan.isCurrent ? 'bg-white/[0.06]' : 'bg-koppar/20'
        )}>
          <Icon className={cn('w-6 h-6', plan.isCurrent ? 'text-kalkvit/50' : 'text-koppar')} />
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
              <span className="font-display text-4xl font-bold text-kalkvit">${price}</span>
              <span className="text-kalkvit/50">/mo</span>
            </div>
            {isAnnual && (
              <p className="text-sm text-skogsgron mt-1">
                Save ${plan.price * 12 - plan.priceAnnual}/year
              </p>
            )}
          </>
        )}
      </div>

      {plan.isCurrent ? (
        <GlassButton variant="ghost" className="w-full mb-6" disabled>
          Current Plan
        </GlassButton>
      ) : (
        <Link to="/shop/success">
          <GlassButton variant={plan.isPopular ? 'primary' : 'secondary'} className="w-full mb-6">
            Upgrade to {plan.name}
            <ArrowRight className="w-4 h-4" />
          </GlassButton>
        </Link>
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
            <GlassBadge variant="success" className="ml-2">Save 17%</GlassBadge>
          </span>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} isAnnual={isAnnual} />
          ))}
        </div>

        {/* Features Comparison */}
        <GlassCard variant="base" className="mb-12">
          <h2 className="font-display text-2xl font-bold text-kalkvit text-center mb-8">
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
