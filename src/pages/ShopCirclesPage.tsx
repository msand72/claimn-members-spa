import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge } from '../components/ui'
import { Users, Calendar, Lock, Star, ChevronRight, Award, Clock } from 'lucide-react'
import { cn } from '../lib/utils'

interface PremiumCircle {
  id: number
  name: string
  description: string
  category: string
  members: number
  maxMembers: number
  price: number
  priceFrequency: 'monthly' | 'one-time'
  rating: number
  reviews: number
  isPurchased: boolean
  isExclusive: boolean
  nextMeeting: string
  leader: {
    name: string
    initials: string
    title: string
  }
  benefits: string[]
}

const mockPremiumCircles: PremiumCircle[] = [
  {
    id: 1,
    name: 'CEO Mastermind',
    description: 'An exclusive circle for founders and CEOs scaling to 8-figures. Weekly calls, hot seats, and direct access to proven operators.',
    category: 'Leadership',
    members: 12,
    maxMembers: 15,
    price: 497,
    priceFrequency: 'monthly',
    rating: 5.0,
    reviews: 23,
    isPurchased: false,
    isExclusive: true,
    nextMeeting: 'Every Tuesday, 7 AM PST',
    leader: { name: 'Michael Chen', initials: 'MC', title: 'Serial Entrepreneur' },
    benefits: ['Weekly 90-min mastermind calls', 'Private Slack channel', 'Annual retreat invite', '1:1 hot seats monthly'],
  },
  {
    id: 2,
    name: 'High-Performance Athletes',
    description: 'For serious athletes and fitness enthusiasts pursuing peak physical performance. Accountability, nutrition, and training optimization.',
    category: 'Health',
    members: 28,
    maxMembers: 30,
    price: 97,
    priceFrequency: 'monthly',
    rating: 4.9,
    reviews: 67,
    isPurchased: true,
    isExclusive: false,
    nextMeeting: 'Daily 6 AM check-in',
    leader: { name: 'Sarah Thompson', initials: 'ST', title: 'Performance Coach' },
    benefits: ['Daily accountability', 'Custom workout plans', 'Nutrition guidance', 'Monthly challenges'],
  },
  {
    id: 3,
    name: 'Investor Circle',
    description: 'Connect with active investors to share deal flow, conduct due diligence together, and learn from each other\'s wins and losses.',
    category: 'Finance',
    members: 18,
    maxMembers: 25,
    price: 297,
    priceFrequency: 'monthly',
    rating: 4.8,
    reviews: 34,
    isPurchased: false,
    isExclusive: true,
    nextMeeting: 'Bi-weekly Thursdays',
    leader: { name: 'David Wilson', initials: 'DW', title: 'Angel Investor' },
    benefits: ['Deal flow sharing', 'Due diligence workshops', 'Expert guest speakers', 'Investment thesis reviews'],
  },
  {
    id: 4,
    name: 'Writers\' Room',
    description: 'A circle for aspiring and published authors. Weekly writing sprints, feedback sessions, and publishing guidance.',
    category: 'Creative',
    members: 35,
    maxMembers: 40,
    price: 47,
    priceFrequency: 'monthly',
    rating: 4.9,
    reviews: 89,
    isPurchased: false,
    isExclusive: false,
    nextMeeting: 'Every Saturday, 9 AM',
    leader: { name: 'Emily Davis', initials: 'ED', title: 'Bestselling Author' },
    benefits: ['Weekly writing sprints', 'Peer feedback rounds', 'Publishing workshops', 'Author Q&As'],
  },
  {
    id: 5,
    name: 'Sales Accelerator',
    description: 'For B2B sales professionals looking to level up. Role plays, pipeline reviews, and proven closing techniques.',
    category: 'Business',
    members: 22,
    maxMembers: 25,
    price: 147,
    priceFrequency: 'monthly',
    rating: 4.7,
    reviews: 56,
    isPurchased: false,
    isExclusive: false,
    nextMeeting: 'Mondays & Wednesdays',
    leader: { name: 'James Miller', initials: 'JM', title: 'VP of Sales' },
    benefits: ['Live role plays', 'Deal coaching', 'Script library access', 'Monthly competitions'],
  },
]

const categories = ['All', 'Leadership', 'Health', 'Finance', 'Creative', 'Business']

function CircleCard({ circle }: { circle: PremiumCircle }) {
  const spotsLeft = circle.maxMembers - circle.members

  return (
    <GlassCard variant="base" className="group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <GlassBadge variant="default">{circle.category}</GlassBadge>
          {circle.isExclusive && (
            <GlassBadge variant="koppar" className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              Exclusive
            </GlassBadge>
          )}
        </div>
        {circle.isPurchased && (
          <GlassBadge variant="success">Member</GlassBadge>
        )}
      </div>

      <h3 className="font-display text-xl font-bold text-kalkvit mb-2 group-hover:text-koppar transition-colors">
        {circle.name}
      </h3>
      <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">{circle.description}</p>

      {/* Leader */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/[0.03]">
        <GlassAvatar initials={circle.leader.initials} size="sm" />
        <div>
          <p className="text-sm font-medium text-kalkvit">{circle.leader.name}</p>
          <p className="text-xs text-kalkvit/50">{circle.leader.title}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {circle.members}/{circle.maxMembers}
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 text-brand-amber fill-brand-amber" />
          {circle.rating}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {circle.nextMeeting.split(',')[0]}
        </span>
      </div>

      {/* Benefits preview */}
      <div className="mb-4">
        <p className="text-xs text-kalkvit/40 mb-2">Includes:</p>
        <div className="flex flex-wrap gap-1">
          {circle.benefits.slice(0, 2).map((benefit, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-lg bg-white/[0.06] text-kalkvit/60">
              {benefit}
            </span>
          ))}
          {circle.benefits.length > 2 && (
            <span className="text-xs px-2 py-1 text-kalkvit/40">
              +{circle.benefits.length - 2} more
            </span>
          )}
        </div>
      </div>

      {/* Price and CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        {circle.isPurchased ? (
          <>
            <span className="text-skogsgron font-medium text-sm">Active Member</span>
            <Link to={`/circles/${circle.id}`}>
              <GlassButton variant="secondary" className="text-sm">
                Enter Circle
                <ChevronRight className="w-4 h-4" />
              </GlassButton>
            </Link>
          </>
        ) : (
          <>
            <div>
              <span className="font-display text-2xl font-bold text-kalkvit">
                ${circle.price}
              </span>
              <span className="text-sm text-kalkvit/50">
                /{circle.priceFrequency === 'monthly' ? 'mo' : 'once'}
              </span>
              {spotsLeft <= 5 && (
                <p className="text-xs text-tegelrod mt-1">{spotsLeft} spots left</p>
              )}
            </div>
            <GlassButton variant="primary" className="text-sm">
              <Lock className="w-4 h-4" />
              Join Circle
            </GlassButton>
          </>
        )}
      </div>
    </GlassCard>
  )
}

export function ShopCirclesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredCircles = mockPremiumCircles.filter((circle) => {
    return selectedCategory === 'All' || circle.category === selectedCategory
  })

  const myCirclesCount = mockPremiumCircles.filter((c) => c.isPurchased).length

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Premium Circles</h1>
            <p className="text-kalkvit/60">
              Join curated groups led by experts for accelerated growth
            </p>
          </div>
          <GlassCard variant="accent" leftBorder={false} className="px-6 py-3 text-center">
            <p className="text-sm text-kalkvit/60">My Circles</p>
            <p className="font-display text-2xl font-bold text-kalkvit">{myCirclesCount}</p>
          </GlassCard>
        </div>

        {/* Info Banner */}
        <GlassCard variant="base" className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-koppar/20">
            <Clock className="w-6 h-6 text-koppar" />
          </div>
          <div>
            <p className="font-medium text-kalkvit">Premium Circles are different from free Circles</p>
            <p className="text-sm text-kalkvit/60">
              These are paid, curated groups with limited spots, led by verified experts, and include exclusive benefits.
            </p>
          </div>
        </GlassCard>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                selectedCategory === category
                  ? 'bg-koppar text-kalkvit'
                  : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Circles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCircles.map((circle) => (
            <CircleCard key={circle.id} circle={circle} />
          ))}
        </div>

        {filteredCircles.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-kalkvit/60">No circles found in this category.</p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}
