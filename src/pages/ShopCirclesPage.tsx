import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { Users, ChevronRight, Loader2, AlertTriangle, Sparkles } from 'lucide-react'
import { useCircles, useMyCircles } from '../lib/api/hooks'
import type { Circle } from '../lib/api/types'

// Display type for circles in the shop context
interface DisplayCircle {
  id: string
  name: string
  description: string
  members: number
  isPurchased: boolean
}

// Map Circle from API to display format
function mapCircleToDisplayCircle(circle: Circle): DisplayCircle {
  return {
    id: circle.id,
    name: circle.name,
    description: circle.description || 'Join this circle to connect with like-minded members.',
    members: circle.member_count,
    isPurchased: circle.is_member,
  }
}

function CircleCard({ circle }: { circle: DisplayCircle }) {
  return (
    <GlassCard variant="base" className="group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Category badge reserved for future API support */}
        </div>
        {circle.isPurchased && (
          <GlassBadge variant="success">Member</GlassBadge>
        )}
      </div>

      <h3 className="font-display text-xl font-bold text-kalkvit mb-2 group-hover:text-koppar transition-colors">
        {circle.name}
      </h3>
      <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">{circle.description}</p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {circle.members} members
        </span>
      </div>

      {/* CTA */}
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
            <span className="font-display text-xl font-bold text-skogsgron">Free</span>
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

  // Categories not available from API yet - show all circles
  const filteredCircles = displayCircles

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
