import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge } from '../components/ui'
import { Users, Star, ChevronRight, Award, Loader2, AlertTriangle, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'
import { useCircles, useMyCircles } from '../lib/api/hooks'
import type { Circle } from '../lib/api/types'

// Display type for circles in the shop context
interface DisplayCircle {
  id: string
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

// Map Circle from API to display format
function mapCircleToDisplayCircle(circle: Circle): DisplayCircle {
  return {
    id: circle.id,
    name: circle.name,
    description: circle.description || 'Join this circle to connect with like-minded members.',
    category: 'General', // Not available in API
    members: circle.member_count,
    maxMembers: 100, // Default max, not available in API
    price: 0, // Free circles - premium pricing not available in API
    priceFrequency: 'monthly',
    rating: 0, // Not available in API
    reviews: 0, // Not available in API
    isPurchased: circle.is_member,
    isExclusive: false, // Not available in API
    nextMeeting: 'Check circle for details',
    leader: {
      name: 'Circle Admin',
      initials: 'CA',
      title: 'Administrator',
    },
    benefits: [],
  }
}

function CircleCard({ circle }: { circle: DisplayCircle }) {
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

      {/* Leader - only show if not default */}
      {circle.leader.name !== 'Circle Admin' && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/[0.03]">
          <GlassAvatar initials={circle.leader.initials} size="sm" />
          <div>
            <p className="text-sm font-medium text-kalkvit">{circle.leader.name}</p>
            <p className="text-xs text-kalkvit/50">{circle.leader.title}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {circle.members} members
        </span>
        {circle.rating > 0 && (
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-brand-amber fill-brand-amber" />
            {circle.rating}
          </span>
        )}
      </div>

      {/* Benefits preview - only show if benefits exist */}
      {circle.benefits.length > 0 && (
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
      )}

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
              {circle.price > 0 ? (
                <>
                  <span className="font-display text-2xl font-bold text-kalkvit">
                    ${circle.price}
                  </span>
                  <span className="text-sm text-kalkvit/50">
                    /{circle.priceFrequency === 'monthly' ? 'mo' : 'once'}
                  </span>
                </>
              ) : (
                <span className="font-display text-xl font-bold text-skogsgron">Free</span>
              )}
              {spotsLeft <= 5 && circle.maxMembers < 100 && (
                <p className="text-xs text-tegelrod mt-1">{spotsLeft} spots left</p>
              )}
            </div>
            <Link to={`/circles/${circle.id}`}>
              <GlassButton variant="primary" className="text-sm">
                View Circle
                <ChevronRight className="w-4 h-4" />
              </GlassButton>
            </Link>
          </>
        )}
      </div>
    </GlassCard>
  )
}

export function ShopCirclesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')

  // API hooks
  const {
    data: circlesData,
    isLoading: isLoadingCircles,
    error: circlesError,
  } = useCircles({ limit: 50 })

  const {
    data: myCirclesData,
    isLoading: isLoadingMyCircles,
  } = useMyCircles()

  const allCircles = circlesData?.data || []
  const myCircles = myCirclesData || []

  // Map API circles to display format
  const displayCircles: DisplayCircle[] = allCircles.map(mapCircleToDisplayCircle)

  // Get unique categories (currently all 'General' from API, but structure supports future categories)
  const categories = ['All', ...new Set(displayCircles.map((c) => c.category).filter((c) => c !== 'General'))]
  if (displayCircles.some((c) => c.category === 'General') && !categories.includes('General')) {
    categories.push('General')
  }

  const filteredCircles = displayCircles.filter((circle) => {
    return selectedCategory === 'All' || circle.category === selectedCategory
  })

  const myCirclesCount = myCircles.length
  const isLoading = isLoadingCircles || isLoadingMyCircles
  const error = circlesError

  // Error state
  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load circles</h3>
            <p className="text-kalkvit/50 text-sm">
              Please try refreshing the page or check your connection.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

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
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoading ? '-' : myCirclesCount}
            </p>
          </GlassCard>
        </div>

        {/* Info Banner - Premium circles coming soon */}
        <GlassCard variant="base" className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-koppar/20">
            <Sparkles className="w-6 h-6 text-koppar" />
          </div>
          <div>
            <p className="font-medium text-kalkvit">Premium Circles Coming Soon</p>
            <p className="text-sm text-kalkvit/60">
              Paid, curated groups with limited spots, led by verified experts, are in development.
              Browse available circles below or check back soon for premium options.
            </p>
          </div>
        </GlassCard>

        {/* Filters - only show if multiple categories exist */}
        {categories.length > 1 && (
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
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        )}

        {/* Circles Grid */}
        {!isLoading && filteredCircles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCircles.map((circle) => (
              <CircleCard key={circle.id} circle={circle} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredCircles.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <Users className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">No circles available yet</h3>
            <p className="text-kalkvit/50 text-sm mb-4">
              Premium circles are coming soon. Check out our free circles in the meantime.
            </p>
            <Link to="/circles">
              <GlassButton variant="primary">
                Browse Free Circles
                <ChevronRight className="w-4 h-4" />
              </GlassButton>
            </Link>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}
